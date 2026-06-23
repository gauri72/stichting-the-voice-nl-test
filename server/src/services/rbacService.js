import Role from "../models/Role.js";
import Permission from "../models/Permission.js";
import Admin from "../models/Admin.js";
import {
  DEFAULT_ROLES,
  buildPermissionList,
  hasPermission,
  hasAnyPermission,
  canAccessEvent,
} from "../config/rbacConfig.js";

const roleCache = new Map();

export async function ensureDefaultRolesAndPermissions() {
  const permissions = buildPermissionList();
  for (const perm of permissions) {
    await Permission.findOneAndUpdate(
      { key: perm.key },
      { $set: { module: perm.module, action: perm.action, label: perm.label } },
      { upsert: true }
    );
  }

  for (const roleDef of DEFAULT_ROLES) {
    await Role.findOneAndUpdate(
      { slug: roleDef.slug },
      {
        $set: {
          name: roleDef.name,
          description: roleDef.description,
          permissions: roleDef.permissions,
          isSystem: roleDef.isSystem,
          isActive: true,
          dashboardAccess: roleDef.dashboardAccess,
          legacyRole: roleDef.legacyRole || "",
        },
      },
      { upsert: true }
    );
  }

  const roles = await Role.find().lean();
  roleCache.clear();
  for (const role of roles) roleCache.set(role.slug, role);

  const admins = await Admin.find({ roleId: null }).lean();
  for (const admin of admins) {
    const match = DEFAULT_ROLES.find((r) => r.legacyRole === admin.role);
    if (!match) continue;
    const role = await Role.findOne({ slug: match.slug }).select("_id slug").lean();
    if (!role) continue;
    await Admin.updateOne({ _id: admin._id }, { $set: { roleId: role._id, roleSlug: role.slug } });
  }

  return { roles: roles.length, permissions: permissions.length };
}

async function getRoleForAdmin(adminDoc) {
  if (adminDoc.roleId) {
    const role = await Role.findById(adminDoc.roleId).lean();
    if (role?.isActive) return role;
  }
  const slug = adminDoc.roleSlug || mapLegacyRole(adminDoc.role);
  if (slug && roleCache.has(slug)) return roleCache.get(slug);
  const role = await Role.findOne({ slug }).lean();
  if (role) roleCache.set(slug, role);
  return role;
}

function mapLegacyRole(role) {
  const map = {
    superadmin: "super_admin",
    admin: "admin",
    finance: "finance_manager",
    event_manager: "event_manager",
    viewer: "viewer",
  };
  return map[role] || "viewer";
}

export async function resolveAdminPermissions(adminId) {
  const admin = await Admin.findById(adminId).lean();
  if (!admin) return { permissions: [], assignedEvents: [], role: null };

  const role = await getRoleForAdmin(admin);
  let permissions = [...(role?.permissions || [])];

  if (admin.role === "superadmin" || role?.slug === "super_admin") {
    permissions = ["*"];
  }

  if (admin.customPermissions?.length) {
    permissions = [...new Set([...permissions, ...admin.customPermissions])];
  }

  if (admin.assignedModules?.length) {
    const modulePerms = permissions.filter((p) => {
      if (p === "*") return true;
      const mod = p.split(".")[0];
      return admin.assignedModules.includes(mod);
    });
    if (!permissions.includes("*") && admin.assignedModules.length) {
      permissions = modulePerms.length ? modulePerms : permissions;
    }
  }

  return {
    permissions,
    assignedEvents: (admin.assignedEvents || []).map((id) => id.toString()),
    role: role ? { id: role._id.toString(), slug: role.slug, name: role.name } : null,
    status: admin.status,
  };
}

export async function getAdminAccessProfile(adminId) {
  const admin = await Admin.findById(adminId);
  if (!admin) return null;
  const access = await resolveAdminPermissions(adminId);
  return admin.toSafeJSON({
    permissions: access.permissions,
    roleName: access.role?.name || admin.role,
    roleSlug: access.role?.slug || mapLegacyRole(admin.role),
    assignedEvents: access.assignedEvents,
  });
}

export function checkPermission(admin, permission) {
  return hasPermission(admin?.permissions, permission);
}

export function checkAnyPermission(admin, permissions) {
  return hasAnyPermission(admin?.permissions, permissions);
}

export function checkEventAccess(admin, eventId) {
  return canAccessEvent(admin, eventId);
}

export { hasPermission, hasAnyPermission, canAccessEvent };
