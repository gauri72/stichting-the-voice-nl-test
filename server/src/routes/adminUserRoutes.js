import { Router } from "express";
import {
  listUsers,
  getUser,
  createUser,
  updateUser,
} from "../controllers/adminUserController.js";

const router = Router();

router.get("/", listUsers);
router.get("/:id", getUser);
router.post("/", createUser);
router.put("/:id", updateUser);

export default router;
