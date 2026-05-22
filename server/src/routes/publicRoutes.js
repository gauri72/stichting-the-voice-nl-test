import { Router } from "express";
import { getPublicSiteConfig } from "../controllers/publicController.js";

const router = Router();

router.get("/site", getPublicSiteConfig);

export default router;
