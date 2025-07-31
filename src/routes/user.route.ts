import { Router } from "express";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import { deleteUserProfile, getUsers, updateUserProfile } from "../controllers/user.controller";

const userRouter: Router = Router();

userRouter.get("/", authenticate, authorize(["admin"]), getUsers);

userRouter.get("/me", authenticate, (req, res) => {
  res.json(req.user);
});

userRouter.put("/me", authenticate, updateUserProfile);

userRouter.delete("/me", authenticate, deleteUserProfile);

export default userRouter