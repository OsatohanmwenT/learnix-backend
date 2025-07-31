import { Router } from "express";
import {
  completeModuleContent,
  deleteLesson,
  getLessonById,
  updateLessonContent,
  getCourseProgress,
  getUserProgress,
} from "../controllers/content.controller";
import { authenticate, authorize } from "../middlewares/auth.middleware";

const contentRouter: Router = Router();

contentRouter.get("/:id", getLessonById);

contentRouter.put(
  "/:id",
  authenticate,
  authorize(["admin", "instructor"]),
  updateLessonContent
);

contentRouter.delete(
  "/:id",
  authenticate,
  authorize(["admin", "instructor"]),
  deleteLesson
);

contentRouter.post("/:id/complete", authenticate, completeModuleContent);

contentRouter.get("/progress/me", authenticate, getUserProgress);

contentRouter.get("/progress/:courseId", authenticate, getCourseProgress);

export default contentRouter;
