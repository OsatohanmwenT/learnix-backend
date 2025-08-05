import { Router } from "express";
import {
  createCourse,
  deleteCourse,
  getCourseById,
  getCourses,
  updateCourse,
} from "../controllers/course.controller";
import {
  authenticate,
  authorize,
  optionalAuthenticate,
} from "../middlewares/auth.middleware";
import { validate } from "../utils";
import {
  createCourseSchema,
  updateCourseSchema,
} from "../validations/course.validation";
import {
  completeEnrollment,
  getCourseStudents,
  initiateCourseEnrollment,
  unenrollFromCourse,
  checkEnrollmentStatus,
} from "../controllers/enrollment.controller";
import { createModule, getModules } from "../controllers/module.controller";
import { createModuleSchema } from "../validations/module.validation";

const courseRouter: Router = Router();

courseRouter.get("/", getCourses);

courseRouter.post(
  "/",
  authenticate,
  authorize(["instructor", "admin"]),
  validate(createCourseSchema),
  createCourse
);

courseRouter.get("/:id", optionalAuthenticate, getCourseById);

courseRouter.put(
  "/:id",
  authenticate,
  authorize(["instructor", "admin"]),
  validate(updateCourseSchema),
  updateCourse
);

courseRouter.delete(
  "/:id",
  authenticate,
  authorize(["instructor", "admin"]),
  deleteCourse
);

courseRouter.post(
  "/:id/enroll",
  authenticate,
  authorize(["student", "instructor", "admin"]),
  initiateCourseEnrollment
);

courseRouter.post(
  "/enroll/complete",
  authenticate,
  authorize(["student", "instructor", "admin"]),
  completeEnrollment
);

courseRouter.get(
  "/:id/enrollment-status",
  authenticate,
  authorize(["student", "instructor", "admin"]),
  checkEnrollmentStatus
);

courseRouter.post(
  "/:id/unenroll",
  authenticate,
  authorize(["student", "instructor", "admin"]),
  unenrollFromCourse
);

courseRouter.get(
  "/:id/students",
  authenticate,
  authorize(["instructor", "admin", "student"]),
  getCourseStudents
);

courseRouter.get("/:id/modules", getModules);

courseRouter.post(
  "/:id/modules",
  authenticate,
  authorize(["instructor", "admin"]),
  validate(createModuleSchema),
  createModule
);

// courseRouter.get("/:id/quizzes", getQuizzes);

export default courseRouter;
