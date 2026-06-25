import crypto from "crypto";
import bcrypt from "bcryptjs";
import Admin from "../models/Admin.js";
import Role from "../models/Role.js";
import AdminInvitation from "../models/AdminInvitation.js";
import AdminAuditLog from "../models/AdminAuditLog.js";
import Permission from "../models/Permission.js";
import env from "../config/env.js";
import {
  ACCESS_AUDIT_ACTIONS,
  DEFAULT_INVITE_EXPIRY_DAYS,
  hasPermission,
} from "../config/rbacConfig.js";
import { maskSecret } from "../utils/secretEncryption.js";
import { resolveAdminPermissions } from "./rbacService.js";
import { isMailerConfigured, getSmtpTransporter, getMailFromAddress } from "./smtpTransport.js";

const BCRYPT_ROUNDS = 12;

function throwStatus(message, status = 400) {
  const err = new Error(message);
  err.status = status;
  throw err;
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

async function writeAccessAudit({
  adminId,
  action,
  targetType,
  targetId,
  summary,
  detail,
  req,
  oldValue,
  newValue,
}) {
  try {
    await AdminAuditLog.create({
      adminId: adminId || null,
      action,
      targetType,
      targetId: String(targetId || ""),
      summary,
      detail,
      ipAddress: req?.ip || req?.headers?.["x-forwarded-for"]?.toString()?.split(",")[0] || "",
      userAgent: req?.headers?.["user-agent"]?.slice(0, 500) || "",
      oldValueMasked: oldValue ? maskSecret(String(oldValue)) : "",
      newValueMasked: newValue ? maskSecret(String(newValue)) : "",
    });
  } catch (error) {
    console.warn("[access-audit]", error.message);
  }
}

export async function listPermissions() {
  const rows = await Permission.find().sort({ module: 1, action: 1 }).lean();
  return rows.map((p) => ({
    key: p.key,
    module: p.module,
    action: p.action,
    label: p.label,
  }));
}

export async function listRoles() {
  const roles = await Role.find().sort({ name: 1 }).lean();
  const usage = await Admin.aggregate([
    { $group: { _id: "$roleId", count: { $sum: 1 } } },
  ]);
  const usageMap = Object.fromEntries(usage.map((u) => [String(u._id), u.count]));

  return roles.map((r) => ({
    id: r._id.toString(),
    slug: r.slug,
    name: r.name,
    description: r.description,
    permissions: r.permissions,
    isSystem: r.isSystem,
    isActive: r.isActive,
    dashboardAccess: r.dashboardAccess,
    memberCount: usageMap[r._id.toString()] || 0,
  }));
}

export async function createRole(payload, actor, req) {
  const name = String(payload.name || "").trim();
  if (!name) throwStatus("Role name is required.");

  const slug = String(payload.slug || name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");

  if (await Role.exists({ slug })) throwStatus("Role slug already exists.", 409);

  const role = await Role.create({
    slug,
    name,
    description: String(payload.description || "").slice(0, 500),
    permissions: Array.isArray(payload.permissions) ? payload.permissions : [],
    isSystem: false,
    isActive: payload.isActive !== false,
    dashboardAccess: payload.dashboardAccess || "custom",
  });

  await writeAccessAudit({
    adminId: actor?.id,
    action: ACCESS_AUDIT_ACTIONS.ROLE_CREATED,
    targetType: "role",
    targetId: role._id,
    summary: `Created role "${name}"`,
    req,
  });

  return { id: role._id.toString(), slug: role.slug, name: role.name };
}

export async function updateRole(id, payload, actor, req) {
  const role = await Role.findById(id);
  if (!role) throwStatus("Role not found.", 404);
  if (role.isSystem && payload.permissions) {
    throwStatus("System role permissions cannot be fully replaced. Duplicate the role instead.", 403);
  }

  const oldPerms = [...(role.permissions || [])];
  if (payload.name) role.name = String(payload.name).slice(0, 80);
  if (payload.description !== undefined) role.description = String(payload.description).slice(0, 500);
  if (Array.isArray(payload.permissions) && !role.isSystem) role.permissions = payload.permissions;
  if (payload.isActive !== undefined) role.isActive = Boolean(payload.isActive);
  if (payload.dashboardAccess) role.dashboardAccess = payload.dashboardAccess;
  await role.save();

  await writeAccessAudit({
    adminId: actor?.id,
    action: ACCESS_AUDIT_ACTIONS.ROLE_UPDATED,
    targetType: "role",
    targetId: id,
    summary: `Updated role "${role.name}"`,
    oldValue: oldPerms.join(","),
    newValue: (role.permissions || []).join(","),
    req,
  });

  return { id: role._id.toString(), slug: role.slug, name: role.name };
}

export async function duplicateRole(id, actor, req) {
  const role = await Role.findById(id).lean();
  if (!role) throwStatus("Role not found.", 404);
  return createRole(
    {
      name: `${role.name} Copy`,
      description: role.description,
      permissions: role.permissions,
      dashboardAccess: role.dashboardAccess,
    },
    actor,
    req
  );
}

export async function deleteRole(id, actor, req) {
  const role = await Role.findById(id);
  if (!role) throwStatus("Role not found.", 404);
  if (role.isSystem) throwStatus("System roles cannot be deleted.", 403);

  const inUse = await Admin.countDocuments({ roleId: role._id });
  if (inUse > 0) throwStatus("Role is assigned to team members and cannot be deleted.", 409);

  await Role.findByIdAndDelete(id);
  await writeAccessAudit({
    adminId: actor?.id,
    action: ACCESS_AUDIT_ACTIONS.ROLE_DELETED,
    targetType: "role",
    targetId: id,
    summary: `Deleted role "${role.name}"`,
    req,
  });
  return { deleted: true };
}

function formatTeamMember(doc) {
  return {
    id: doc._id.toString(),
    firstName: doc.firstName,
    lastName: doc.lastName,
    email: doc.email,
    phone: doc.phone || "",
    role: doc.role,
    roleId: doc.roleId?.toString?.() || null,
    roleSlug: doc.roleSlug || "",
    status: doc.status || (doc.isActive ? "active" : "disabled"),
    customPermissions: doc.customPermissions || [],
    assignedEvents: (doc.assignedEvents || []).map((id) => id.toString()),
    assignedModules: doc.assignedModules || [],
    notes: doc.notes || "",
    profilePhotoUrl: doc.profilePhotoUrl || "",
    lastLoginAt: doc.lastLoginAt,
    createdAt: doc.createdAt,
  };
}

export async function listTeamMembers() {
  const rows = await Admin.find().sort({ createdAt: -1 }).lean();
  const result = [];
  for (const row of rows) {
    const access = await resolveAdminPermissions(row._id);
    result.push({
      ...formatTeamMember(row),
      permissions: access.permissions,
      roleName: access.role?.name,
    });
  }
  return result;
}

export async function createTeamMember(payload, actor, req) {
  if (!hasPermission(actor?.permissions, "*") && !hasPermission(actor?.permissions, "access_management.edit")) {
    throwStatus("You do not have permission to create team members.", 403);
  }

  const email = String(payload.email || "").trim().toLowerCase();
  const firstName = String(payload.firstName || "").trim();
  const lastName = String(payload.lastName || "").trim();
  if (!email || !firstName) throwStatus("Email and first name are required.");

  if (await Admin.exists({ email })) throwStatus("An admin with this email already exists.", 409);

  let role = null;
  if (payload.roleId) role = await Role.findById(payload.roleId).lean();
  else if (payload.roleSlug) role = await Role.findOne({ slug: payload.roleSlug }).lean();

  const legacyRole = role?.legacyRole || payload.role || "viewer";
  const password = payload.password || generateToken();
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  const admin = await Admin.create({
    firstName,
    lastName: lastName || "",
    email,
    phone: String(payload.phone || "").slice(0, 40),
    passwordHash,
    role: legacyRole,
    roleId: role?._id || null,
    roleSlug: role?.slug || "",
    customPermissions: payload.customPermissions || [],
    assignedEvents: payload.assignedEvents || [],
    assignedModules: payload.assignedModules || [],
    notes: String(payload.notes || "").slice(0, 2000),
    profilePhotoUrl: payload.profilePhotoUrl || "",
    status: payload.sendInvite ? "invited" : "active",
    isActive: payload.status !== "disabled",
    invitedAt: payload.sendInvite ? new Date() : null,
  });

  if (payload.sendInvite) {
    await createInvitation(
      {
        email,
        firstName,
        lastName,
        phone: payload.phone,
        roleId: role?._id,
        roleSlug: role?.slug,
        assignedEvents: payload.assignedEvents,
        assignedModules: payload.assignedModules,
        notes: payload.notes,
        adminId: admin._id,
      },
      actor,
      req
    );
  }

  await writeAccessAudit({
    adminId: actor?.id,
    action: ACCESS_AUDIT_ACTIONS.USER_INVITED,
    targetType: "admin_user",
    targetId: admin._id,
    summary: `Created team member ${email}`,
    req,
  });

  return formatTeamMember(admin);
}

export async function updateTeamMember(id, payload, actor, req) {
  const admin = await Admin.findById(id);
  if (!admin) throwStatus("Team member not found.", 404);

  if (payload.roleId || payload.roleSlug) {
    const role = payload.roleId
      ? await Role.findById(payload.roleId).lean()
      : await Role.findOne({ slug: payload.roleSlug }).lean();

    if (role?.slug === "super_admin" && actor?.id === id) {
      throwStatus("You cannot change your own Super Admin role.", 403);
    }

    if (role?.slug === "super_admin") {
      const superCount = await Admin.countDocuments({
        $or: [{ role: "superadmin" }, { roleSlug: "super_admin" }],
        status: { $in: ["active", "invited"] },
        _id: { $ne: id },
      });
      // allow promoting to super admin
    }

    if (admin.role === "superadmin" || admin.roleSlug === "super_admin") {
      const remaining = await Admin.countDocuments({
        $or: [{ role: "superadmin" }, { roleSlug: "super_admin" }],
        status: { $in: ["active", "invited"] },
        _id: { $ne: id },
      });
      if (remaining === 0 && role?.slug !== "super_admin") {
        throwStatus("Cannot remove the last Super Admin.", 403);
      }
    }

    if (role) {
      admin.roleId = role._id;
      admin.roleSlug = role.slug;
      if (role.legacyRole) admin.role = role.legacyRole;
    }
  }

  if (payload.firstName) admin.firstName = payload.firstName.trim();
  if (payload.lastName !== undefined) admin.lastName = payload.lastName.trim();
  if (payload.phone !== undefined) admin.phone = payload.phone;
  if (Array.isArray(payload.customPermissions)) admin.customPermissions = payload.customPermissions;
  if (Array.isArray(payload.assignedEvents)) admin.assignedEvents = payload.assignedEvents;
  if (Array.isArray(payload.assignedModules)) admin.assignedModules = payload.assignedModules;
  if (payload.notes !== undefined) admin.notes = payload.notes;
  if (payload.profilePhotoUrl !== undefined) admin.profilePhotoUrl = payload.profilePhotoUrl;

  if (payload.status) {
    admin.status = payload.status;
    admin.isActive = !["disabled", "suspended"].includes(payload.status);
  }

  await admin.save();

  await writeAccessAudit({
    adminId: actor?.id,
    action: ACCESS_AUDIT_ACTIONS.USER_UPDATED,
    targetType: "admin_user",
    targetId: id,
    summary: `Updated team member ${admin.email}`,
    req,
  });

  return formatTeamMember(admin);
}

export async function suspendTeamMember(id, actor, req) {
  return updateTeamMember(id, { status: "suspended" }, actor, req);
}

export async function disableTeamMember(id, actor, req) {
  const admin = await Admin.findById(id);
  if (!admin) throwStatus("Team member not found.", 404);
  if ((admin.role === "superadmin" || admin.roleSlug === "super_admin") && actor?.id === id) {
    throwStatus("You cannot disable your own Super Admin account.", 403);
  }
  if (admin.role === "superadmin" || admin.roleSlug === "super_admin") {
    const remaining = await Admin.countDocuments({
      $or: [{ role: "superadmin" }, { roleSlug: "super_admin" }],
      status: { $in: ["active", "invited"] },
      _id: { $ne: id },
    });
    if (remaining === 0) throwStatus("Cannot disable the last Super Admin.", 403);
  }
  return updateTeamMember(id, { status: "disabled" }, actor, req);
}

export async function reactivateTeamMember(id, actor, req) {
  return updateTeamMember(id, { status: "active" }, actor, req);
}

export async function deleteTeamMember(id, actor, req) {
  const admin = await Admin.findById(id);
  if (!admin) throwStatus("Team member not found.", 404);
  if (actor?.id === id) throwStatus("You cannot delete your own account.", 403);
  if (admin.role === "superadmin" || admin.roleSlug === "super_admin") {
    const remaining = await Admin.countDocuments({
      $or: [{ role: "superadmin" }, { roleSlug: "super_admin" }],
      status: { $in: ["active", "invited"] },
      _id: { $ne: id },
    });
    if (remaining === 0) throwStatus("Cannot delete the last Super Admin.", 403);
  }

  await Admin.findByIdAndDelete(id);
  await AdminInvitation.updateMany({ adminId: id }, { status: "revoked" });

  await writeAccessAudit({
    adminId: actor?.id,
    action: ACCESS_AUDIT_ACTIONS.USER_DELETED,
    targetType: "admin_user",
    targetId: id,
    summary: `Deleted team member ${admin.email}`,
    req,
  });

  return { deleted: true };
}

async function sendInviteEmail({ email, firstName, roleName, inviteUrl, expiresAt }) {
  if (!isMailerConfigured()) {
    console.warn("[invite] Mailer not configured; invite URL:", inviteUrl);
    return { sent: false, inviteUrl };
  }

  const transport = getSmtpTransporter();
  const from = getMailFromAddress();
  const orgName = "Stichting The V.O.I.C.E. NL";

  await transport.sendMail({
    from,
    to: email,
    subject: `You're invited to ${orgName} Admin`,
    html: `
      <p>Hello ${firstName || "there"},</p>
      <p>You have been invited to join the <strong>${orgName}</strong> admin panel as <strong>${roleName}</strong>.</p>
      <p><a href="${inviteUrl}" style="display:inline-block;padding:12px 20px;background:#2abdc1;color:#0d1a2a;text-decoration:none;border-radius:8px;font-weight:bold;">Accept invitation</a></p>
      <p>This invitation expires on ${expiresAt.toLocaleDateString("en-GB")}.</p>
      <p>If you did not expect this email, you can ignore it.</p>
    `,
  });

  return { sent: true };
}

export async function createInvitation(payload, actor, req) {
  const email = String(payload.email || "").trim().toLowerCase();
  if (!email) throwStatus("Email is required.");

  const expiryDays = Number(payload.expiryDays) || DEFAULT_INVITE_EXPIRY_DAYS;
  const token = generateToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000);

  let role = null;
  if (payload.roleId) role = await Role.findById(payload.roleId).lean();
  else if (payload.roleSlug) role = await Role.findOne({ slug: payload.roleSlug }).lean();

  const invitation = await AdminInvitation.create({
    email,
    firstName: payload.firstName || "",
    lastName: payload.lastName || "",
    phone: payload.phone || "",
    roleId: role?._id || null,
    roleSlug: role?.slug || payload.roleSlug || "viewer",
    tokenHash,
    expiresAt,
    invitedBy: actor?.id || null,
    assignedEvents: payload.assignedEvents || [],
    assignedModules: payload.assignedModules || [],
    notes: payload.notes || "",
    adminId: payload.adminId || null,
    status: "pending",
  });

  const inviteUrl = `${env.clientUrl}/admin/accept-invite?token=${token}`;
  await sendInviteEmail({
    email,
    firstName: payload.firstName,
    roleName: role?.name || payload.roleSlug,
    inviteUrl,
    expiresAt,
  });

  await writeAccessAudit({
    adminId: actor?.id,
    action: ACCESS_AUDIT_ACTIONS.USER_INVITED,
    targetType: "admin_invitation",
    targetId: invitation._id,
    summary: `Invited ${email}`,
    req,
  });

  return {
    id: invitation._id.toString(),
    email,
    expiresAt,
    inviteUrl: env.nodeEnv === "development" ? inviteUrl : undefined,
  };
}

export async function listInvitations() {
  const rows = await AdminInvitation.find().sort({ createdAt: -1 }).limit(200).lean();
  return rows.map((r) => ({
    id: r._id.toString(),
    email: r.email,
    firstName: r.firstName,
    lastName: r.lastName,
    roleSlug: r.roleSlug,
    status: r.status,
    expiresAt: r.expiresAt,
    createdAt: r.createdAt,
  }));
}

export async function resendInvitation(id, actor, req) {
  const invite = await AdminInvitation.findById(id);
  if (!invite || invite.status !== "pending") throwStatus("Invitation not found or not pending.", 404);
  if (invite.expiresAt < new Date()) {
    invite.status = "expired";
    await invite.save();
    throwStatus("Invitation has expired. Create a new invitation.", 410);
  }

  const token = generateToken();
  invite.tokenHash = hashToken(token);
  invite.expiresAt = new Date(Date.now() + DEFAULT_INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
  await invite.save();

  const role = invite.roleId ? await Role.findById(invite.roleId).lean() : null;
  const inviteUrl = `${env.clientUrl}/admin/accept-invite?token=${token}`;
  await sendInviteEmail({
    email: invite.email,
    firstName: invite.firstName,
    roleName: role?.name || invite.roleSlug,
    inviteUrl,
    expiresAt: invite.expiresAt,
  });

  await writeAccessAudit({
    adminId: actor?.id,
    action: ACCESS_AUDIT_ACTIONS.INVITE_RESENT,
    targetType: "admin_invitation",
    targetId: id,
    summary: `Resent invite to ${invite.email}`,
    req,
  });

  return { resent: true, inviteUrl: env.nodeEnv === "development" ? inviteUrl : undefined };
}

export async function verifyInvitationToken(token) {
  const tokenHash = hashToken(token);
  const invite = await AdminInvitation.findOne({ tokenHash, status: "pending" }).lean();
  if (!invite) throwStatus("Invalid or expired invitation.", 404);
  if (invite.expiresAt < new Date()) throwStatus("Invitation has expired.", 410);

  const role = invite.roleId ? await Role.findById(invite.roleId).lean() : await Role.findOne({ slug: invite.roleSlug }).lean();

  return {
    email: invite.email,
    firstName: invite.firstName,
    lastName: invite.lastName,
    roleName: role?.name || invite.roleSlug,
    expiresAt: invite.expiresAt,
  };
}

export async function acceptInvitation({ token, password, firstName, lastName }, req) {
  const tokenHash = hashToken(token);
  const invite = await AdminInvitation.findOne({ tokenHash, status: "pending" });
  if (!invite) throwStatus("Invalid or expired invitation.", 404);
  if (invite.expiresAt < new Date()) {
    invite.status = "expired";
    await invite.save();
    throwStatus("Invitation has expired.", 410);
  }

  if (!password || String(password).length < 8) {
    throwStatus("Password must be at least 8 characters.");
  }

  const role = invite.roleId ? await Role.findById(invite.roleId).lean() : await Role.findOne({ slug: invite.roleSlug }).lean();
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  let admin = invite.adminId ? await Admin.findById(invite.adminId) : await Admin.findOne({ email: invite.email });

  if (!admin) {
    admin = await Admin.create({
      firstName: firstName || invite.firstName,
      lastName: lastName || invite.lastName,
      email: invite.email,
      phone: invite.phone,
      passwordHash,
      role: role?.legacyRole || "viewer",
      roleId: role?._id || null,
      roleSlug: role?.slug || invite.roleSlug,
      assignedEvents: invite.assignedEvents,
      assignedModules: invite.assignedModules,
      notes: invite.notes,
      status: "active",
      isActive: true,
      invitationId: invite._id,
    });
  } else {
    admin.passwordHash = passwordHash;
    admin.status = "active";
    admin.isActive = true;
    admin.firstName = firstName || admin.firstName;
    admin.lastName = lastName || admin.lastName;
    await admin.save();
  }

  invite.status = "accepted";
  await invite.save();

  await writeAccessAudit({
    adminId: admin._id,
    action: ACCESS_AUDIT_ACTIONS.INVITE_ACCEPTED,
    targetType: "admin_invitation",
    targetId: invite._id,
    summary: `${invite.email} accepted invitation`,
    req,
  });

  return { accepted: true, email: admin.email };
}

export async function listAccessAuditLogs(query = {}) {
  const filter = {};
  if (query.action) filter.action = query.action;
  if (query.adminId) filter.adminId = query.adminId;
  if (query.cmsOnly) filter.action = { $regex: "^cms_" };

  const rows = await AdminAuditLog.find(filter).sort({ createdAt: -1 }).limit(300).lean();
  const adminIds = [...new Set(rows.filter((r) => r.adminId).map((r) => String(r.adminId)))];
  const admins = await Admin.find({ _id: { $in: adminIds } }).select("firstName lastName email").lean();
  const adminMap = Object.fromEntries(admins.map((a) => [a._id.toString(), a]));

  return rows.map((r) => ({
    id: r._id.toString(),
    action: r.action,
    targetType: r.targetType,
    targetId: r.targetId,
    summary: r.summary,
    timestamp: r.createdAt,
    ipAddress: r.ipAddress,
    userAgent: r.userAgent,
    oldValueMasked: r.oldValueMasked,
    newValueMasked: r.newValueMasked,
    user: adminMap[String(r.adminId)]
      ? `${adminMap[String(r.adminId)].firstName} ${adminMap[String(r.adminId)].lastName}`
      : "System",
    email: adminMap[String(r.adminId)]?.email || "",
  }));
}

export async function getAccessSettings() {
  return {
    inviteExpiryDays: DEFAULT_INVITE_EXPIRY_DAYS,
    organizationName: "Stichting The V.O.I.C.E. NL",
    requireMfa: false,
  };
}

export async function updateAccessSettings(payload, actor, req) {
  await writeAccessAudit({
    adminId: actor?.id,
    action: ACCESS_AUDIT_ACTIONS.SETTINGS_CHANGED,
    targetType: "access_settings",
    targetId: "global",
    summary: "Access settings updated",
    detail: payload,
    req,
  });
  return getAccessSettings();
}

export { writeAccessAudit };
