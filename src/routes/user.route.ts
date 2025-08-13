import { Router } from "express";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import {
  deleteUserProfile,
  getUsers,
  updateUserProfile,
} from "../controllers/user.controller";
import { getUserEnrolledCourses } from "../controllers/enrollment.controller";

const userRouter: Router = Router();

userRouter.get("/", authenticate, authorize(["admin"]), getUsers);

userRouter.get("/me", authenticate, (req, res) => {
  res.json(req.user);
});

userRouter.get("/me/enrolled-courses", authenticate, getUserEnrolledCourses);

userRouter.put("/me", authenticate, updateUserProfile);

userRouter.delete("/me", authenticate, deleteUserProfile);

export default userRouter;
