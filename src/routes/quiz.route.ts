import { Router } from "express";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import {
  createQuiz,
  createQuizQuestions,
  deleteQuiz,
  getQuizById,
  updateQuiz,
} from "../controllers/quiz.controller";
import { validate } from "../utils";
import {
  createQuizSchema,
  updateQuizSchema,
} from "../validations/quiz.validation";
import { createQuizSession, getQuizInfo, getQuizQuestions, getUserQuizResults, submitQuiz } from "../controllers/quizSession.controller";
import { submitQuizSchema } from "../validations/quizSession.validation";

const quizRouter: Router = Router();

quizRouter.post(
  "/",
  authenticate,
  authorize(["admin", "instructor"]),
  validate(createQuizSchema),
  createQuiz
);

quizRouter.put(
  "/:id",
  authenticate,
  authorize(["admin", "instructor"]),
  validate(updateQuizSchema),
  updateQuiz
);

quizRouter.delete(
  "/:id",
  authenticate,
  authorize(["admin", "instructor"]),
  deleteQuiz
);

quizRouter.post(
  "/:id/questions",
  authenticate,
  authorize(["admin", "instructor"]),
  createQuizQuestions
);

quizRouter.get(
  "/:id",
  authenticate,
  authorize(["admin", "instructor"]),
  getQuizById
);

quizRouter.get("/:id/info", authenticate, getQuizInfo);

quizRouter.post("/:id/start", authenticate, createQuizSession);

quizRouter.post(
  "/:id/submit",
  authenticate,
  validate(submitQuizSchema),
  submitQuiz
);

quizRouter.get("/:id/results", authenticate, getUserQuizResults);

quizRouter.get(
  "/session/:sessionId/questions",
  authenticate,
  getQuizQuestions
);

export default quizRouter;
