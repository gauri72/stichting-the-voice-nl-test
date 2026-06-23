import PageVersion from "../models/PageVersion.js";
import { getNextSequence } from "../utils/sequence.js";
import { throwError } from "./cmsValidationService.js";

async function nextVersionId() {
  const seq = await getNextSequence("cms_page_version");
  const year = new Date().getFullYear();
  return `PV-${year}-${String(seq).padStart(6, "0")}`;
}

export async function createPageVersion({ page, changeNote, status, adminId }) {
  const versionId = await nextVersionId();
  const snapshot = {
    title: page.title,
    route: page.route,
    seo: page.seo,
    sections: page.draftSections,
    status: page.status,
  };

  const version = await PageVersion.create({
    versionId,
    pageId: page.pageId || page._id.toString(),
    pageSlug: page.slug,
    snapshot,
    changeNote: changeNote || "",
    status: status || "draft",
    createdBy: adminId || null,
  });

  return version.toObject();
}

export async function listPageVersions(pageSlug, limit = 30) {
  return PageVersion.find({ pageSlug })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("createdBy", "name email")
    .lean();
}

export async function getPageVersion(versionId) {
  const version = await PageVersion.findOne({ versionId })
    .populate("createdBy", "name email")
    .lean();
  if (!version) throwError("Version not found.", 404);
  return version;
}

export async function comparePageVersions(versionIdA, versionIdB) {
  const [a, b] = await Promise.all([
    getPageVersion(versionIdA),
    getPageVersion(versionIdB),
  ]);
  return { versionA: a, versionB: b };
}
