import ReusableBlock from "../models/ReusableBlock.js";
import { CMS_AUDIT_ACTIONS } from "../config/cmsConfig.js";
import { logAdminAction } from "./adminAuditService.js";
import { throwError, generateId, sanitizeSection } from "./cmsValidationService.js";

function formatBlock(block) {
  return {
    blockId: block.blockId,
    name: block.name,
    category: block.category,
    sectionType: block.sectionType,
    draft: block.draft,
    published: block.published,
    usageCount: block.usageCount,
    createdAt: block.createdAt,
    updatedAt: block.updatedAt,
  };
}

export async function listReusableBlocks() {
  const blocks = await ReusableBlock.find().sort({ name: 1 }).lean();
  return blocks.map(formatBlock);
}

export async function getReusableBlock(blockId) {
  const block = await ReusableBlock.findOne({ blockId }).lean();
  if (!block) throwError("Reusable block not found.", 404);
  return formatBlock(block);
}

export async function createReusableBlock(payload, adminId) {
  const name = (payload.name || "").trim();
  if (!name) throwError("Block name is required.");
  if (!payload.sectionType) throwError("Section type is required.");

  const state = sanitizeSection({
    content: payload.content || {},
    images: payload.images || {},
    ctas: payload.ctas || [],
    settings: payload.settings || {},
  });

  const block = await ReusableBlock.create({
    blockId: generateId("block"),
    name,
    category: payload.category || "general",
    sectionType: payload.sectionType,
    draft: state,
    published: state,
    createdBy: adminId,
    updatedBy: adminId,
  });

  await logAdminAction({
    adminId,
    action: CMS_AUDIT_ACTIONS.BLOCK_CREATED,
    targetType: "cms_block",
    targetId: block.blockId,
    summary: `Created reusable block: ${block.name}`,
  });

  return formatBlock(block.toObject());
}

export async function updateReusableBlockDraft(blockId, payload, adminId) {
  const block = await ReusableBlock.findOne({ blockId });
  if (!block) throwError("Reusable block not found.", 404);

  if (payload.name) block.name = payload.name;
  if (payload.category) block.category = payload.category;

  const current = block.draft?.toObject?.() || block.draft || {};
  const next = sanitizeSection({ ...current, ...payload });
  block.draft = {
    content: next.content ?? current.content,
    images: next.images ?? current.images,
    ctas: next.ctas ?? current.ctas,
    settings: next.settings ?? current.settings,
  };
  block.updatedBy = adminId;
  await block.save();

  await logAdminAction({
    adminId,
    action: CMS_AUDIT_ACTIONS.BLOCK_UPDATED,
    targetType: "cms_block",
    targetId: block.blockId,
    summary: `Updated reusable block (draft): ${block.name}`,
  });

  return formatBlock(block.toObject());
}

export async function publishReusableBlock(blockId, adminId) {
  const block = await ReusableBlock.findOne({ blockId });
  if (!block) throwError("Reusable block not found.", 404);

  block.published = JSON.parse(JSON.stringify(block.draft));
  block.updatedBy = adminId;
  await block.save();

  await logAdminAction({
    adminId,
    action: CMS_AUDIT_ACTIONS.BLOCK_PUBLISHED,
    targetType: "cms_block",
    targetId: block.blockId,
    summary: `Published reusable block: ${block.name}`,
  });

  return formatBlock(block.toObject());
}

export async function deleteReusableBlock(blockId, adminId) {
  const block = await ReusableBlock.findOne({ blockId }).lean();
  if (!block) throwError("Reusable block not found.", 404);
  if (block.usageCount > 0) {
    throwError(`Cannot delete — still used on ${block.usageCount} section(s). Unlink it from those sections first.`, 409);
  }
  await ReusableBlock.deleteOne({ blockId });

  await logAdminAction({
    adminId,
    action: CMS_AUDIT_ACTIONS.BLOCK_DELETED,
    targetType: "cms_block",
    targetId: blockId,
    summary: `Deleted reusable block: ${block.name}`,
  });
}

/**
 * "Edit once, update everywhere": resolves any section carrying a
 * linkedBlockId against that block's current content (draft or published,
 * matching the version being read). Sections without a linkedBlockId pass
 * through untouched. A deleted/missing block degrades gracefully — the
 * section keeps its own embedded content rather than disappearing.
 */
export async function hydrateSections(sections = [], { draft = false } = {}) {
  const linkedIds = [...new Set(sections.filter((s) => s.linkedBlockId).map((s) => s.linkedBlockId))];
  if (!linkedIds.length) return sections;

  const blocks = await ReusableBlock.find({ blockId: { $in: linkedIds } }).lean();
  const blockMap = new Map(blocks.map((b) => [b.blockId, b]));

  return sections.map((section) => {
    if (!section.linkedBlockId) return section;
    const block = blockMap.get(section.linkedBlockId);
    if (!block) return section;
    const state = draft ? block.draft : block.published;
    return {
      ...section,
      sectionType: block.sectionType,
      content: state?.content || {},
      images: state?.images || {},
      ctas: state?.ctas || [],
      settings: state?.settings || {},
    };
  });
}

export async function incrementBlockUsage(blockId, delta) {
  if (!blockId) return;
  await ReusableBlock.updateOne({ blockId }, { $inc: { usageCount: delta } });
}
