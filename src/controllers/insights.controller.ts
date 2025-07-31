import { NextFunction, Request, Response } from "express";
import { generateLearningInsights } from "../services/insights.service";

interface ErrorType extends Error {
  statusCode?: number;
}

export const getUserInsights = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      const error: ErrorType = new Error("User ID is required");
      error.statusCode = 401;
      throw error;
    }

    const insights = await generateLearningInsights(userId);

    res.json({
      success: true,
      message: "Learning insights generated successfully",
      data: insights,
    });
  } catch (error) {
    next(error);
  }
};
