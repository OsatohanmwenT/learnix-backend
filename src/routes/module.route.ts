import { Router } from "express";
import {
  getModuleContent,
  createModuleContent,
  getModuleById,
  updateModule,
  deleteModule,
} from "../controllers/module.controller";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import { validate } from "../utils";
import { createContentSchema } from "../validations/content.validation";

const moduleRouter: Router = Router();

moduleRouter.get("/:id", getModuleById);

moduleRouter.put(
  "/:id",
  authenticate,
  authorize(["admin", "instructor"]),
  updateModule
);

moduleRouter.delete(
  "/:id",
  authenticate,
  authorize(["admin", "instructor"]),
  deleteModule
);

moduleRouter.get("/:id/content", getModuleContent);

moduleRouter.post(
  "/:id/content",
  authenticate,
  authorize(["admin", "instructor"]),
  validate(createContentSchema),
  createModuleContent
);

export default moduleRouter;
