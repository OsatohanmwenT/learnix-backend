import { Router } from "express";
import {
  refreshAccessToken,
  signIn,
  signOut,
  signUp,
} from "../controllers/auth.controller";
import { signInSchema, signUpSchema } from "../validations/user.validation";
import { validate } from "../utils";

const authRouter: Router = Router();

authRouter.post("/sign-in", validate(signInSchema), signIn);

authRouter.post("/sign-up", validate(signUpSchema), signUp);

authRouter.get("/sign-out", signOut);

authRouter.post("/refresh-token", refreshAccessToken);

export default authRouter;
