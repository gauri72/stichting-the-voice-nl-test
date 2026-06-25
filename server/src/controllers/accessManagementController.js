import {
  listTeamMembers,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember,
  suspendTeamMember,
  disableTeamMember,
  reactivateTeamMember,
  listRoles,
  createRole,
  updateRole,
  duplicateRole,
  deleteRole,
  listPermissions,
  createInvitation,
  listInvitations,
  resendInvitation,
  verifyInvitationToken,
  acceptInvitation,
  listAccessAuditLogs,
  getAccessSettings,
  updateAccessSettings,
} from "../services/accessManagementService.js";

import { handleError as handleErrorBase } from "../utils/handleError.js";

function handleError(res, error) {
  return handleErrorBase(res, error, { logTag: "[access]" });
}

export async function getTeamMembers(req, res) {
  try {
    const members = await listTeamMembers();
    return res.json({ members });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function postTeamMember(req, res) {
  try {
    const member = await createTeamMember(req.body || {}, req.admin, req);
    return res.status(201).json({ member });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function patchTeamMember(req, res) {
  try {
    const member = await updateTeamMember(req.params.id, req.body || {}, req.admin, req);
    return res.json({ member });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function deleteTeamMemberHandler(req, res) {
  try {
    const result = await deleteTeamMember(req.params.id, req.admin, req);
    return res.json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function suspendTeamMemberHandler(req, res) {
  try {
    const member = await suspendTeamMember(req.params.id, req.admin, req);
    return res.json({ member });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function disableTeamMemberHandler(req, res) {
  try {
    const member = await disableTeamMember(req.params.id, req.admin, req);
    return res.json({ member });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function reactivateTeamMemberHandler(req, res) {
  try {
    const member = await reactivateTeamMember(req.params.id, req.admin, req);
    return res.json({ member });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getRoles(req, res) {
  try {
    const roles = await listRoles();
    return res.json({ roles });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function postRole(req, res) {
  try {
    const role = await createRole(req.body || {}, req.admin, req);
    return res.status(201).json({ role });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function patchRole(req, res) {
  try {
    const role = await updateRole(req.params.id, req.body || {}, req.admin, req);
    return res.json({ role });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function duplicateRoleHandler(req, res) {
  try {
    const role = await duplicateRole(req.params.id, req.admin, req);
    return res.status(201).json({ role });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function deleteRoleHandler(req, res) {
  try {
    const result = await deleteRole(req.params.id, req.admin, req);
    return res.json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getPermissions(req, res) {
  try {
    const permissions = await listPermissions();
    return res.json({ permissions });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function postInvitation(req, res) {
  try {
    const invitation = await createInvitation(req.body || {}, req.admin, req);
    return res.status(201).json({ invitation });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getInvitations(req, res) {
  try {
    const invitations = await listInvitations();
    return res.json({ invitations });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function resendInvitationHandler(req, res) {
  try {
    const result = await resendInvitation(req.params.id, req.admin, req);
    return res.json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function verifyInvitationPublic(req, res) {
  try {
    const data = await verifyInvitationToken(req.query.token);
    return res.json(data);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function acceptInvitationPublic(req, res) {
  try {
    const result = await acceptInvitation(req.body || {}, req);
    return res.json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getAuditLogs(req, res) {
  try {
    const logs = await listAccessAuditLogs(req.query || {});
    return res.json({ logs });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getSettings(req, res) {
  try {
    const settings = await getAccessSettings();
    return res.json({ settings });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function patchSettings(req, res) {
  try {
    const settings = await updateAccessSettings(req.body || {}, req.admin, req);
    return res.json({ settings });
  } catch (error) {
    return handleError(res, error);
  }
}
