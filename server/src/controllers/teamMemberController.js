import {
  listPublicTeamMembers,
  listAdminTeamMembers,
  getAdminTeamMemberById,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember,
  reorderTeamMembers,
} from "../services/teamMemberService.js";

function handleError(res, error) {
  const status = error.status || 500;
  if (status >= 500) console.error("[team-members]", error);
  return res.status(status).json({ error: error.message || "Something went wrong." });
}

export async function listTeamMembersPublic(req, res) {
  try {
    const members = await listPublicTeamMembers();
    return res.json({ members });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function listTeamMembersAdmin(req, res) {
  try {
    const members = await listAdminTeamMembers();
    return res.json({ members });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getTeamMemberAdmin(req, res) {
  try {
    const member = await getAdminTeamMemberById(req.params.id);
    return res.json({ member });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function createTeamMemberAdmin(req, res) {
  try {
    const member = await createTeamMember(req.body || {});
    return res.status(201).json({ member });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function patchTeamMemberAdmin(req, res) {
  try {
    const member = await updateTeamMember(req.params.id, req.body || {});
    return res.json({ member });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function deleteTeamMemberAdmin(req, res) {
  try {
    const result = await deleteTeamMember(req.params.id);
    return res.json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function reorderTeamMembersAdmin(req, res) {
  try {
    const members = await reorderTeamMembers(req.body?.order || []);
    return res.json({ members });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function uploadTeamMemberPhotoAdmin(req, res) {
  try {
    const { imageUrl } = req.body || {};
    if (!imageUrl) {
      return res.status(400).json({ error: "Image data is required." });
    }
    const member = await updateTeamMember(req.params.id, { imageUrl });
    return res.json({ member });
  } catch (error) {
    return handleError(res, error);
  }
}
