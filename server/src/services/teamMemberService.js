import TeamMember from "../models/TeamMember.js";
import { DEFAULT_TEAM_MEMBERS } from "../config/teamMemberDefaults.js";

function trimField(value, maxLen) {
  return String(value || "").trim().slice(0, maxLen);
}

export function getInitials(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
}

function formatPublicMember(doc) {
  return {
    id: doc._id?.toString(),
    displayOrder: doc.displayOrder ?? 0,
    fullName: doc.fullName,
    name: doc.fullName,
    role: doc.role || "",
    designation: doc.designation || "",
    teamCategory: doc.teamCategory || "",
    biography: doc.biography || "",
    imageUrl: doc.imageUrl || "",
    imageAssetKey: doc.imageAssetKey || "",
    linkedinUrl: doc.linkedinUrl || "",
    email: doc.email || "",
    yearsWithVoice: doc.yearsWithVoice || "",
    initials: getInitials(doc.fullName),
    featured: Boolean(doc.featured),
    isBoardMember: Boolean(doc.isBoardMember),
  };
}

function formatAdminMember(doc) {
  return {
    ...formatPublicMember(doc),
    visible: doc.visible !== false,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function throwStatus(message, status = 400) {
  const err = new Error(message);
  err.status = status;
  throw err;
}

export async function listPublicTeamMembers() {
  const rows = await TeamMember.find({ visible: { $ne: false } })
    .sort({ displayOrder: 1, fullName: 1 })
    .lean();
  return rows.map(formatPublicMember);
}

export async function listAdminTeamMembers() {
  const rows = await TeamMember.find().sort({ displayOrder: 1, fullName: 1 }).lean();
  return rows.map(formatAdminMember);
}

export async function getAdminTeamMemberById(id) {
  const doc = await TeamMember.findById(id).lean();
  if (!doc) throwStatus("Team member not found.", 404);
  return formatAdminMember(doc);
}

export async function createTeamMember(payload = {}) {
  const fullName = trimField(payload.fullName ?? payload.name, 120);
  if (!fullName) throwStatus("Full name is required.");

  const maxOrder = await TeamMember.findOne().sort({ displayOrder: -1 }).select("displayOrder").lean();
  const displayOrder = Number.isFinite(Number(payload.displayOrder))
    ? Number(payload.displayOrder)
    : (maxOrder?.displayOrder ?? 0) + 1;

  const created = await TeamMember.create({
    displayOrder,
    fullName,
    role: trimField(payload.role, 120),
    designation: trimField(payload.designation, 80),
    teamCategory: trimField(payload.teamCategory, 80),
    biography: trimField(payload.biography, 4000),
    imageUrl: payload.imageUrl || "",
    imageAssetKey: trimField(payload.imageAssetKey, 40),
    linkedinUrl: trimField(payload.linkedinUrl, 500),
    email: trimField(payload.email, 200),
    yearsWithVoice: trimField(payload.yearsWithVoice, 40),
    featured: Boolean(payload.featured),
    isBoardMember: Boolean(payload.isBoardMember),
    visible: payload.visible !== false,
  });

  return formatAdminMember(created.toObject());
}

export async function updateTeamMember(id, payload = {}) {
  const doc = await TeamMember.findById(id);
  if (!doc) throwStatus("Team member not found.", 404);

  const fields = [
    "fullName",
    "role",
    "designation",
    "teamCategory",
    "biography",
    "imageUrl",
    "imageAssetKey",
    "linkedinUrl",
    "email",
    "yearsWithVoice",
  ];

  for (const field of fields) {
    if (payload[field] !== undefined) {
      const max = field === "biography" ? 4000 : field === "imageUrl" ? undefined : field === "linkedinUrl" ? 500 : 120;
      doc[field] = max ? trimField(payload[field], max) : String(payload[field] || "");
    }
  }

  if (payload.name !== undefined && payload.fullName === undefined) {
    doc.fullName = trimField(payload.name, 120);
  }

  if (payload.displayOrder !== undefined) doc.displayOrder = Number(payload.displayOrder) || 0;
  if (payload.featured !== undefined) doc.featured = Boolean(payload.featured);
  if (payload.isBoardMember !== undefined) doc.isBoardMember = Boolean(payload.isBoardMember);
  if (payload.visible !== undefined) doc.visible = Boolean(payload.visible);

  await doc.save();
  return formatAdminMember(doc.toObject());
}

export async function deleteTeamMember(id) {
  const doc = await TeamMember.findByIdAndDelete(id);
  if (!doc) throwStatus("Team member not found.", 404);
  return { deleted: true, id };
}

export async function reorderTeamMembers(order = []) {
  if (!Array.isArray(order) || order.length === 0) {
    throwStatus("Order array is required.");
  }

  const ops = order.map((id, index) =>
    TeamMember.updateOne({ _id: id }, { $set: { displayOrder: index + 1 } })
  );
  await Promise.all(ops);
  return listAdminTeamMembers();
}

export async function ensureDefaultTeamMembers() {
  const count = await TeamMember.countDocuments();
  if (count > 0) return { seeded: false, count };

  await TeamMember.insertMany(
    DEFAULT_TEAM_MEMBERS.map((member) => ({
      ...member,
      visible: true,
      biography: "",
      imageUrl: "",
      linkedinUrl: "",
      email: "",
      yearsWithVoice: "",
    }))
  );

  return { seeded: true, count: DEFAULT_TEAM_MEMBERS.length };
}
