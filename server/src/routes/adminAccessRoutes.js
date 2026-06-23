import { Router } from "express";
import { requireAdmin } from "../middleware/adminMiddleware.js";
import { requirePermission } from "../middleware/rbacMiddleware.js";
import {
  getTeamMembers,
  postTeamMember,
  patchTeamMember,
  deleteTeamMemberHandler,
  suspendTeamMemberHandler,
  disableTeamMemberHandler,
  reactivateTeamMemberHandler,
  getRoles,
  postRole,
  patchRole,
  duplicateRoleHandler,
  deleteRoleHandler,
  getPermissions,
  postInvitation,
  getInvitations,
  resendInvitationHandler,
  verifyInvitationPublic,
  acceptInvitationPublic,
  getAuditLogs,
  getSettings,
  patchSettings,
} from "../controllers/accessManagementController.js";

const router = Router();

router.get("/invitations/verify", verifyInvitationPublic);
router.post("/invitations/accept", acceptInvitationPublic);

router.use(requireAdmin);

router.get("/permissions", requirePermission("access_management.view"), getPermissions);
router.get("/audit-logs", requirePermission("access_management.view"), getAuditLogs);
router.get("/settings", requirePermission("access_management.view"), getSettings);
router.patch("/settings", requirePermission("access_management.edit"), patchSettings);

router.get("/team-members", requirePermission("access_management.view"), getTeamMembers);
router.post("/team-members", requirePermission("access_management.edit"), postTeamMember);
router.patch("/team-members/:id", requirePermission("access_management.edit"), patchTeamMember);
router.delete("/team-members/:id", requirePermission("access_management.edit"), deleteTeamMemberHandler);
router.post("/team-members/:id/suspend", requirePermission("access_management.edit"), suspendTeamMemberHandler);
router.post("/team-members/:id/disable", requirePermission("access_management.edit"), disableTeamMemberHandler);
router.post("/team-members/:id/reactivate", requirePermission("access_management.edit"), reactivateTeamMemberHandler);

router.get("/roles", requirePermission("access_management.view"), getRoles);
router.post("/roles", requirePermission("access_management.edit"), postRole);
router.patch("/roles/:id", requirePermission("access_management.edit"), patchRole);
router.post("/roles/:id/duplicate", requirePermission("access_management.edit"), duplicateRoleHandler);
router.delete("/roles/:id", requirePermission("access_management.edit"), deleteRoleHandler);

router.get("/invitations", requirePermission("access_management.view"), getInvitations);
router.post("/invitations", requirePermission("access_management.edit"), postInvitation);
router.post("/invitations/:id/resend", requirePermission("access_management.edit"), resendInvitationHandler);

export default router;
