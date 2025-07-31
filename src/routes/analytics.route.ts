import { Router } from "express";
import {
  getCourseStatistics,
  getPlatformAnalytics,
  getInstructorAnalytics,
} from "../controllers/analytics.controller";
import { authenticate, authorize } from "../middlewares/auth.middleware";

const analyticsRouter: Router = Router();

// Course statistics for instructors/admins
analyticsRouter.get(
  "/courses/:courseId",
  authenticate,
  authorize(["instructor", "admin"]),
  getCourseStatistics
);

// Platform-wide analytics for admins only
analyticsRouter.get(
  "/platform",
  authenticate,
  authorize(["admin"]),
  getPlatformAnalytics
);

// Instructor's own course analytics
analyticsRouter.get(
  "/instructor",
  authenticate,
  authorize(["instructor", "admin"]),
  getInstructorAnalytics
);

export default analyticsRouter;
