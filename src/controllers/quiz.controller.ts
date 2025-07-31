import { Request, Response, NextFunction } from "express";
import { eq } from "drizzle-orm";
import { db } from "../database/";
import { answerOptions, questions, quizzes } from "../database/schemas/assessment.schema";
import { lessons } from "../database/schemas/content.schema";

export const getQuizById = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  try {
    if (!id) {
      const error: ErrorType = new Error("Quiz ID is required");
      error.statusCode = 400;
      throw error;
    }

    const [quiz] = await db.query.quizzes.findMany({
      where: eq(quizzes.id, id),
      with: {
        questions: {
          with: {
            answerOptions: true,
          },
        },
      },
    });

    if (!quiz) {
      const error: ErrorType = new Error("Quiz not found");
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({
      success: true,
      quiz,
    });
  } catch (error) {
    next(error);
  }
};

export const createQuiz = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const {
    title,
    description,
    lessonId,
    difficulty,
    maxAttempts,
    timeLimit,
    passingScore,
    randomizeQuestions,
    showCorrectAnswers,
  } = req.body;
  try {
    const [lesson] = await db
      .select()
      .from(lessons)
      .where(eq(lessons.id, lessonId));

    if (!lesson) {
      const error: ErrorType = new Error("Lesson not found");
      error.statusCode = 404;
      throw error;
    }

    const [quiz] = await db
      .insert(quizzes)
      .values({
        title,
        description,
        lessonId,
        difficulty,
        maxAttempts,
        timeLimit,
        passingScore,
        randomizeQuestions,
        showCorrectAnswers,
      })
      .returning();

    res.status(201).json({
      success: true,
      message: "Quiz created successfully",
      quiz,
    });
  } catch (error) {
    next(error);
  }
};

export const updateQuiz = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;
  const {
    title,
    description,
    lessonId,
    difficulty,
    maxAttempts,
    timeLimit,
    passingScore,
    randomizeQuestions,
    showCorrectAnswers,
  } = req.body;
  try {
    if (!id) {
      const error: ErrorType = new Error("Quiz ID is required");
      error.statusCode = 400;
      throw error;
    }

    const [quiz] = await db.select().from(quizzes).where(eq(quizzes.id, id));

    if (!quiz) {
      const error: ErrorType = new Error("Quiz not found");
      error.statusCode = 404;
      throw error;
    }

    const [updatedQuiz] = await db
      .update(quizzes)
      .set({
        title,
        description,
        lessonId,
        difficulty,
        maxAttempts,
        timeLimit,
        passingScore,
        randomizeQuestions,
        showCorrectAnswers,
      })
      .where(eq(quizzes.id, id))
      .returning();

    res.status(200).json({
      success: true,
      message: "Quiz updated successfully",
      quiz: updatedQuiz,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteQuiz = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;

  try {
    if (!id) {
      const error: ErrorType = new Error("Quiz ID is required");
      error.statusCode = 400;
      throw error;
    }

    const [quiz] = await db.select().from(quizzes).where(eq(quizzes.id, id));

    if (!quiz) {
      const error: ErrorType = new Error("Quiz not found");
      error.statusCode = 404;
      throw error;
    }

    await db.delete(quizzes).where(eq(quizzes.id, id));

    res.status(200).json({
      success: true,
      message: "Quiz deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const createQuizQuestions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { quizQuestions } = req.body;
  const { id } = req.params;

  try {
    if (!id) {
      const error: ErrorType = new Error("Quiz ID is required");
      error.statusCode = 400;
      return next(error);
    }

    const quizExists = await db
      .select()
      .from(quizzes)
      .where(eq(quizzes.id, id));

    if (!quizExists) {
      const error: ErrorType = new Error("Quiz not found");
      error.statusCode = 404;
      throw error;
    }

    await db.transaction(async (tx) => {
      for (const question of quizQuestions) {
        const [insertedQuestion] = await tx.insert(questions).values({
          quizId: id,
          text: question.text,
          questionType: question.questionType,
          correctAnswer: question.correctAnswer,
          feedback: question.feedback,
          points: question.points,
          orderIndex: question.orderIndex,
          isActive: question.isActive,
        }).returning();

        if (!insertedQuestion) {
          throw new Error("Failed to insert question")
        }

        const optionsToInsert = question.answerOptions.map((opt: any) => ({
          questionId: insertedQuestion.id,
          text: opt.text,
          isCorrect: opt.isCorrect,
          explanation: opt.explanation,
          orderIndex: opt.orderIndex,
        }));

        await tx.insert(answerOptions).values(optionsToInsert)
      }
    });

    return res.status(201).json({
      success: true,
      message: "Questions added successfully.",
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};
