import { Router } from "express";
import { requireAdmin } from "../middleware/adminMiddleware.js";
import {
  listTeamMembersAdmin,
  getTeamMemberAdmin,
  createTeamMemberAdmin,
  patchTeamMemberAdmin,
  deleteTeamMemberAdmin,
  reorderTeamMembersAdmin,
  uploadTeamMemberPhotoAdmin,
} from "../controllers/teamMemberController.js";

const router = Router();
router.use(requireAdmin);

router.get("/", listTeamMembersAdmin);
router.post("/", createTeamMemberAdmin);
router.post("/reorder", reorderTeamMembersAdmin);
router.get("/:id", getTeamMemberAdmin);
router.patch("/:id", patchTeamMemberAdmin);
router.post("/:id/upload-photo", uploadTeamMemberPhotoAdmin);
router.delete("/:id", deleteTeamMemberAdmin);

export default router;
