import { Router } from "express";
import {
  listVolunteerApplications,
  listVentureStudioMessages,
} from "../controllers/adminContactSubmissionsController.js";

const router = Router();

router.get("/volunteer-applications", listVolunteerApplications);
router.get("/venture-studio-messages", listVentureStudioMessages);

export default router;
