import { Router } from "express";
import { generateAIQuestions } from "../controllers/ai.controller";
import { getUserInsights } from "../controllers/insights.controller";
import { authenticate } from "../middlewares/auth.middleware";

const AIRouter: Router = Router();

// AI Question Generation
AIRouter.post("/generate", generateAIQuestions);

// Simple AI Learning Insights
AIRouter.get("/insights", authenticate, getUserInsights);

export default AIRouter;
