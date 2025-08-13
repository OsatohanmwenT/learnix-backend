import { Request, Response, NextFunction } from "express";
import { eq, and } from "drizzle-orm";
import { db } from "../database/";
import {
  answerOptions,
  questions,
  quizzes,
} from "../database/schemas/assessment.schema";
import { lessons } from "../database/schemas/content.schema";

export const getAllQuizzes = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page = 1, limit = 10, difficulty, lessonId } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    // Build where conditions
    const whereConditions = [];
    if (
      difficulty &&
      ["beginner", "intermediate", "advanced", "expert"].includes(
        difficulty as string
      )
    ) {
      whereConditions.push(
        eq(
          quizzes.difficulty,
          difficulty as "beginner" | "intermediate" | "advanced" | "expert"
        )
      );
    }
    if (lessonId) {
      whereConditions.push(eq(quizzes.lessonId, lessonId as string));
    }

    const whereClause =
      whereConditions.length > 0 ? and(...whereConditions) : undefined;

    const allQuizzes = await db.query.quizzes.findMany({
      where: whereClause,
      with: {
        questions: {
          columns: {
            id: true,
            questionType: true,
            points: true,
          },
        },
      },
      limit: Number(limit),
      offset: offset,
    });

    // Get total count for pagination
    const totalQuizzes = await db.query.quizzes.findMany({
      where: whereClause,
      columns: { id: true },
    });

    const totalPages = Math.ceil(totalQuizzes.length / Number(limit));

    console.log(allQuizzes);

    res.status(200).json({
      success: true,
      data: {
        quizzes: allQuizzes,
        currentPage: Number(page),
        totalPages,
        totalItems: totalQuizzes.length,
        itemsPerPage: Number(limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getQuizById = async (
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
      data: quiz,
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
      data: quiz,
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

    const createdQuestions: any[] = [];

    await db.transaction(async (tx) => {
      for (const question of quizQuestions) {
        const [insertedQuestion] = await tx
          .insert(questions)
          .values({
            quizId: id,
            text: question.text,
            questionType: question.questionType,
            correctAnswer: question.correctAnswer,
            feedback: question.feedback,
            points: question.points,
            orderIndex: question.orderIndex,
            isActive: question.isActive,
          })
          .returning();

        if (!insertedQuestion) {
          throw new Error("Failed to insert question");
        }

        const optionsToInsert = question.answerOptions.map((opt: any) => ({
          questionId: insertedQuestion.id,
          text: opt.text,
          isCorrect: opt.isCorrect,
          explanation: opt.explanation,
          orderIndex: opt.orderIndex,
        }));

        const insertedOptions = await tx
          .insert(answerOptions)
          .values(optionsToInsert)
          .returning();

        createdQuestions.push({
          ...insertedQuestion,
          answerOptions: insertedOptions,
        });
      }
    });

    return res.status(201).json({
      success: true,
      message: "Questions added successfully.",
      data: {
        quizId: id,
        questionsCreated: createdQuestions.length,
        questions: createdQuestions,
      },
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

export const updateQuizQuestion = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { questionId } = req.params;
  const {
    text,
    questionType,
    correctAnswer,
    feedback,
    points,
    orderIndex,
    isActive,
    answerOptions: newAnswerOptions,
  } = req.body;

  try {
    if (!questionId) {
      const error: ErrorType = new Error("Question ID is required");
      error.statusCode = 400;
      return next(error);
    }

    // Check if question exists
    const [existingQuestion] = await db
      .select()
      .from(questions)
      .where(eq(questions.id, questionId));

    if (!existingQuestion) {
      const error: ErrorType = new Error("Question not found");
      error.statusCode = 404;
      throw error;
    }

    let updatedQuestion;

    await db.transaction(async (tx) => {
      // Update the question
      [updatedQuestion] = await tx
        .update(questions)
        .set({
          text: text ?? existingQuestion.text,
          questionType: questionType ?? existingQuestion.questionType,
          correctAnswer: correctAnswer ?? existingQuestion.correctAnswer,
          feedback: feedback ?? existingQuestion.feedback,
          points: points ?? existingQuestion.points,
          orderIndex: orderIndex ?? existingQuestion.orderIndex,
          isActive: isActive ?? existingQuestion.isActive,
        })
        .where(eq(questions.id, questionId))
        .returning();

      // If answerOptions are provided, update them
      if (newAnswerOptions && Array.isArray(newAnswerOptions)) {
        // Delete existing answer options
        await tx
          .delete(answerOptions)
          .where(eq(answerOptions.questionId, questionId));

        // Insert new answer options
        const optionsToInsert = newAnswerOptions.map((opt: any) => ({
          questionId: questionId,
          text: opt.text,
          isCorrect: opt.isCorrect,
          explanation: opt.explanation,
          orderIndex: opt.orderIndex,
        }));

        await tx.insert(answerOptions).values(optionsToInsert);
      }
    });

    // Fetch the updated question with its answer options
    const [finalQuestion] = await db.query.questions.findMany({
      where: eq(questions.id, questionId),
      with: {
        answerOptions: true,
      },
    });

    res.status(200).json({
      success: true,
      message: "Question updated successfully",
      data: finalQuestion,
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

export const deleteQuizQuestion = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { questionId } = req.params;

  try {
    if (!questionId) {
      const error: ErrorType = new Error("Question ID is required");
      error.statusCode = 400;
      return next(error);
    }

    // Check if question exists
    const [existingQuestion] = await db
      .select()
      .from(questions)
      .where(eq(questions.id, questionId));

    if (!existingQuestion) {
      const error: ErrorType = new Error("Question not found");
      error.statusCode = 404;
      throw error;
    }

    // Delete the question (answer options will be deleted automatically due to cascade)
    await db.delete(questions).where(eq(questions.id, questionId));

    res.status(200).json({
      success: true,
      message: "Question deleted successfully",
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};
