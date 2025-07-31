import { Request, Response, NextFunction } from "express";
import { db } from "../database";
import {
  quizzes,
  questions as questionsTable,
  answerOptions,
  quizSubmissions,
  questionResponses,
} from "../database/schemas/assessment.schema";
import { eq, and, desc, count, max, inArray } from "drizzle-orm";

interface ErrorType extends Error {
  statusCode?: number;
}

const checkAndCompleteExpiredSession = async (
  sessionId: string,
  session: {
    timeLimit: number | null;
    startedAt: Date;
    isCompleted: boolean;
  }
): Promise<boolean> => {
  if (!session.timeLimit || session.isCompleted) {
    return false;
  }

  const isExpired =
    Date.now() >
    new Date(session.startedAt).getTime() + session.timeLimit * 60 * 1000;

  if (isExpired) {
    await db
      .update(quizSubmissions)
      .set({
        submittedAt: new Date(),
        isCompleted: true,
      })
      .where(eq(quizSubmissions.id, sessionId));

    return true; 
  }

  return false;
};

export const getQuizInfo = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id: quizId } = req.params;
  const userId = req.user?.userId;

  try {
    if (!quizId || !userId) {
      const error: ErrorType = new Error(
        "Quiz ID and user authentication required"
      );
      error.statusCode = 400;
      throw error;
    }

    const [quizResult, questionCountResult] = await Promise.all([
      db
        .select({
          id: quizzes.id,
          title: quizzes.title,
          description: quizzes.description,
          difficulty: quizzes.difficulty,
          maxAttempts: quizzes.maxAttempts,
          timeLimit: quizzes.timeLimit,
          passingScore: quizzes.passingScore,
          randomizeQuestions: quizzes.randomizeQuestions,
          showCorrectAnswers: quizzes.showCorrectAnswers,
          attemptCount: count(quizSubmissions.id),
          hasPassedAttempt: max(quizSubmissions.isPassed),
          lastAttemptDate: max(quizSubmissions.submittedAt),
        })
        .from(quizzes)
        .leftJoin(
          quizSubmissions,
          and(
            eq(quizSubmissions.quizId, quizzes.id),
            eq(quizSubmissions.userId, userId)
          )
        )
        .where(eq(quizzes.id, quizId))
        .groupBy(
          quizzes.id,
          quizzes.title,
          quizzes.description,
          quizzes.difficulty,
          quizzes.maxAttempts,
          quizzes.timeLimit,
          quizzes.passingScore,
          quizzes.randomizeQuestions,
          quizzes.showCorrectAnswers
        ),
      db
        .select({ questionCount: count() })
        .from(questionsTable)
        .where(
          and(
            eq(questionsTable.quizId, quizId),
            eq(questionsTable.isActive, true)
          )
        ),
    ]);

    const [result] = quizResult;
    const [{ questionCount }] = questionCountResult;

    if (!result) {
      const error: ErrorType = new Error("Quiz not found");
      error.statusCode = 404;
      throw error;
    }

    const canAttempt =
      !result.maxAttempts || result.attemptCount < result.maxAttempts;
    const remainingAttempts = result.maxAttempts
      ? result.maxAttempts - result.attemptCount
      : null;

    res.status(200).json({
      success: true,
      data: {
        quiz: {
          id: result.id,
          title: result.title,
          description: result.description,
          difficulty: result.difficulty,
          timeLimit: result.timeLimit,
          passingScore: result.passingScore,
          questionCount,
        },
        userStats: {
          canAttempt,
          remainingAttempts,
          totalAttempts: result.attemptCount,
          maxAttempts: result.maxAttempts,
          hasPassed: !!result.hasPassedAttempt,
          lastAttemptDate: result.lastAttemptDate,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createQuizSession = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id: quizId } = req.params;
  const userId = req.user?.userId;

  try {
    if (!quizId || !userId) {
      const error: ErrorType = new Error(
        "Quiz ID and user authentication required"
      );
      error.statusCode = 400;
      throw error;
    }

    const [quizResult, attemptInfoResult, activeSessionResult] =
      await Promise.all([
        db
          .select({
            id: quizzes.id,
            maxAttempts: quizzes.maxAttempts,
            timeLimit: quizzes.timeLimit,
          })
          .from(quizzes)
          .where(eq(quizzes.id, quizId)),
        db
          .select({
            attemptCount: count(),
            maxAttemptNumber: max(quizSubmissions.attemptNumber),
          })
          .from(quizSubmissions)
          .where(
            and(
              eq(quizSubmissions.userId, userId),
              eq(quizSubmissions.quizId, quizId)
            )
          ),
        db
          .select({ id: quizSubmissions.id })
          .from(quizSubmissions)
          .where(
            and(
              eq(quizSubmissions.userId, userId),
              eq(quizSubmissions.quizId, quizId),
              eq(quizSubmissions.isCompleted, false)
            )
          )
          .limit(1),
      ]);

    const [quiz] = quizResult;
    const [attemptInfo] = attemptInfoResult;
    const [activeSession] = activeSessionResult;

    if (!quiz) {
      const error: ErrorType = new Error("Quiz not found");
      error.statusCode = 404;
      throw error;
    }

    const attemptCount = attemptInfo?.attemptCount || 0;
    const nextAttemptNumber = (attemptInfo?.maxAttemptNumber || 0) + 1;
    const maxedOut = quiz.maxAttempts && attemptCount >= quiz.maxAttempts;

    if (maxedOut) {
      const error: ErrorType = new Error(
        `Maximum attempts exceeded. You have used ${attemptCount}/${quiz.maxAttempts} attempts.`
      );
      error.statusCode = 400;
      throw error;
    }

    if (activeSession) {
      const error: ErrorType = new Error(
        "You already have an active session for this quiz"
      );
      error.statusCode = 400;
      throw error;
    }

    // Create session
    const [session] = await db
      .insert(quizSubmissions)
      .values({
        userId,
        quizId,
        attemptNumber: nextAttemptNumber,
        startedAt: new Date(),
        isCompleted: false,
        score: 0,
        percentageScore: 0,
        isPassed: false,
      })
      .returning({
        id: quizSubmissions.id,
        startedAt: quizSubmissions.startedAt,
        attemptNumber: quizSubmissions.attemptNumber,
      });

    res.status(201).json({
      success: true,
      message: "Quiz session created successfully",
      data: {
        sessionId: session.id,
        attemptNumber: session.attemptNumber,
        startedAt: session.startedAt,
        expiresAt: quiz.timeLimit
          ? new Date(Date.now() + quiz.timeLimit * 60 * 1000).toISOString()
          : null,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getQuizQuestions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { sessionId } = req.params;
  const userId = req.user?.userId;
  const { page = "1", limit = "10" } = req.query as {
    page?: string;
    limit?: string;
  };

  try {
    if (!sessionId || !userId) {
      const error: ErrorType = new Error(
        "Session ID and user authentication required"
      );
      error.statusCode = 400;
      throw error;
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const offset = (pageNum - 1) * limitNum;

    const [sessionResult, questionCountResult] = await Promise.all([
      db
        .select({
          id: quizSubmissions.id,
          quizId: quizSubmissions.quizId,
          startedAt: quizSubmissions.startedAt,
          isCompleted: quizSubmissions.isCompleted,
          timeLimit: quizzes.timeLimit,
          randomizeQuestions: quizzes.randomizeQuestions,
        })
        .from(quizSubmissions)
        .innerJoin(quizzes, eq(quizSubmissions.quizId, quizzes.id))
        .where(
          and(
            eq(quizSubmissions.id, sessionId),
            eq(quizSubmissions.userId, userId)
          )
        ),
      db
        .select({ totalQuestions: count() })
        .from(questionsTable)
        .innerJoin(
          quizSubmissions,
          eq(questionsTable.quizId, quizSubmissions.quizId)
        )
        .where(
          and(
            eq(quizSubmissions.id, sessionId),
            eq(questionsTable.isActive, true)
          )
        ),
    ]);

    const [session] = sessionResult;
    const [{ totalQuestions }] = questionCountResult;

    if (!session) {
      const error: ErrorType = new Error(
        "Quiz session not found or access denied"
      );
      error.statusCode = 404;
      throw error;
    }

    if (session.isCompleted) {
      const error: ErrorType = new Error(
        "Quiz session has already been completed"
      );
      error.statusCode = 400;
      throw error;
    }

    // Check if session has expired and auto-complete if needed
    const wasExpired = await checkAndCompleteExpiredSession(sessionId, {
      timeLimit: session.timeLimit,
      startedAt: session.startedAt,
      isCompleted: session.isCompleted,
    });

    if (wasExpired) {
      const error: ErrorType = new Error(
        "Quiz session has expired and has been automatically completed"
      );
      error.statusCode = 400;
      throw error;
    }

    // Fetch questions with answer options
    const questions = await db.query.questions.findMany({
      where: and(
        eq(questionsTable.quizId, session.quizId),
        eq(questionsTable.isActive, true)
      ),
      limit: limitNum,
      offset: offset,
      orderBy: session.randomizeQuestions
        ? questionsTable.id
        : questionsTable.orderIndex,
      with: {
        answerOptions: {
          columns: {
            id: true,
            text: true,
            orderIndex: true,
          },
        },
      },
    });

    const totalPages = Math.ceil(totalQuestions / limitNum);

    res.status(200).json({
      success: true,
      data: {
        sessionId,
        questions: questions,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalQuestions,
          questionsPerPage: limitNum,
          hasNextPage: pageNum < totalPages,
          hasPreviousPage: pageNum > 1,
        },
        session: {
          expiresAt: session.timeLimit
            ? new Date(
                new Date(session.startedAt).getTime() +
                  session.timeLimit * 60 * 1000
              ).toISOString()
            : null,
          timeRemaining: session.timeLimit
            ? Math.max(
                0,
                session.timeLimit * 60 -
                  Math.floor(
                    (Date.now() - new Date(session.startedAt).getTime()) / 1000
                  )
              )
            : null,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const submitQuiz = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { sessionId, answers, timeSpent } = req.body;
  const userId = req.user?.userId;
  try {
    if (!sessionId || !userId) {
      const error: ErrorType = new Error(
        "Session ID and user authentication required"
      );
      error.statusCode = 400;
      throw error;
    }

    if (!answers?.length) {
      const error: ErrorType = new Error("No answers provided");
      error.statusCode = 400;
      throw error;
    }

    const result = await db.transaction(async (tx) => {
      const answerIds = answers.map((a: any) => a.answerId).filter(Boolean);
      const questionIds = answers.map((a: any) => a.questionId);

      const [sessionAndQuestionsData, answerOptionsData] = await Promise.all([
        tx
          .select({
            submissionId: quizSubmissions.id,
            quizId: quizSubmissions.quizId,
            startedAt: quizSubmissions.startedAt,
            isCompleted: quizSubmissions.isCompleted,
            timeLimit: quizzes.timeLimit,
            passingScore: quizzes.passingScore,
            questionId: questionsTable.id,
            questionType: questionsTable.questionType,
            correctAnswer: questionsTable.correctAnswer,
            points: questionsTable.points,
          })
          .from(quizSubmissions)
          .innerJoin(quizzes, eq(quizSubmissions.quizId, quizzes.id))
          .innerJoin(
            questionsTable,
            and(
              eq(questionsTable.quizId, quizzes.id),
              eq(questionsTable.isActive, true),
              inArray(questionsTable.id, questionIds)
            )
          )
          .where(
            and(
              eq(quizSubmissions.id, sessionId),
              eq(quizSubmissions.userId, userId)
            )
          ),

        answerIds.length > 0
          ? tx
              .select({
                id: answerOptions.id,
                questionId: answerOptions.questionId,
                isCorrect: answerOptions.isCorrect,
              })
              .from(answerOptions)
              .where(inArray(answerOptions.id, answerIds))
          : [],
      ]);

      if (!sessionAndQuestionsData.length) {
        const error: ErrorType = new Error(
          "Quiz session not found or access denied"
        );
        error.statusCode = 404;
        throw error;
      }

      const session = sessionAndQuestionsData[0];
      if (session.isCompleted) {
        const error: ErrorType = new Error("Quiz already submitted");
        error.statusCode = 400;
        throw error;
      }

      const timeTaken = Math.floor(
        (Date.now() - new Date(session.startedAt).getTime()) / 1000
      );
      if (session.timeLimit && timeTaken > session.timeLimit * 60) {
        const error: ErrorType = new Error("Quiz session has expired");
        error.statusCode = 400;
        throw error;
      }

      const questionsMap = new Map();
      const answerOptionsMap = new Map();

      for (const row of sessionAndQuestionsData) {
        if (!questionsMap.has(row.questionId)) {
          questionsMap.set(row.questionId, {
            questionType: row.questionType,
            correctAnswer: row.correctAnswer,
            points: row.points,
          });
        }
      }
      
      for (const option of answerOptionsData) {
        answerOptionsMap.set(option.id, {
          questionId: option.questionId,
          isCorrect: option.isCorrect,
        });
      }

      let totalScore = 0;
      let totalPossiblePoints = 0;
      let correctCount = 0;

      const responseData = new Array(answers.length);

      for (let i = 0; i < answers.length; i++) {
        const answer = answers[i];
        const question = questionsMap.get(answer.questionId);

        if (!question) continue;
        totalPossiblePoints += question.points;

        let isCorrect = false;
        const chosenOption = answerOptionsMap.get(answer.answerId);

        if (chosenOption && chosenOption.questionId === answer.questionId) {
          isCorrect = chosenOption.isCorrect;
        }
        const pointsEarned = isCorrect ? question.points : 0;
        totalScore += pointsEarned;
        if (isCorrect) correctCount++;

        responseData[i] = {
          submissionId: sessionId,
          questionId: answer.questionId,
          selectedOptionId: answer.answerChosenId,
          submittedAnswer: null,
          isCorrect,
          pointsEarned,
        };

      }

      const validResponses = responseData.filter(Boolean);

      if (validResponses.length > 0) {
        await tx.insert(questionResponses).values(validResponses);
      }

      const percentageScore = totalPossiblePoints > 0 ? 
        Math.round((totalScore / totalPossiblePoints) * 100) : 0;
      const isPassed = percentageScore >= session.passingScore;

      // Update submission
      const [updatedSubmission] = await tx
        .update(quizSubmissions)
        .set({
          submittedAt: new Date(),
          score: totalScore,
          percentageScore,
          isCompleted: true,
          isPassed,
        })
        .where(eq(quizSubmissions.id, sessionId))
        .returning({
          id: quizSubmissions.id,
          submittedAt: quizSubmissions.submittedAt,
        });

      return {
        submission: updatedSubmission,
        responses: validResponses,
        stats: {
          totalScore,
          totalPossiblePoints,
          percentageScore,
          isPassed,
          timeTaken: timeSpent || timeTaken,
          correctAnswers: correctCount,
          totalQuestions: validResponses.length,
        }
      };
    });

    const response = {
      success: true,
      message: result.stats.isPassed ? "Quiz passed successfully!" : "Quiz completed",
      data: {
        submissionId: result.submission.id,
        stats: result.stats,
        submittedAt: result.submission.submittedAt,
      },
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const getUserQuizResults = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id: quizId } = req.params;
  const userId = req.user?.userId;

  try {
    if (!quizId || !userId) {
      const error: ErrorType = new Error(
        "Quiz ID and user authentication required"
      );
      error.statusCode = 400;
      throw error;
    }

    // Execute submissions query and quiz info in parallel for better performance
    const [submissions, quizInfo] = await Promise.all([
      db
        .select({
          id: quizSubmissions.id,
          attemptNumber: quizSubmissions.attemptNumber,
          startedAt: quizSubmissions.startedAt,
          submittedAt: quizSubmissions.submittedAt,
          score: quizSubmissions.score,
          percentageScore: quizSubmissions.percentageScore,
          isPassed: quizSubmissions.isPassed,
          isCompleted: quizSubmissions.isCompleted,
        })
        .from(quizSubmissions)
        .where(
          and(
            eq(quizSubmissions.userId, userId),
            eq(quizSubmissions.quizId, quizId)
          )
        )
        .orderBy(desc(quizSubmissions.attemptNumber)),
      // Optionally fetch quiz info for additional context
      db
        .select({
          title: quizzes.title,
          maxAttempts: quizzes.maxAttempts,
          passingScore: quizzes.passingScore,
        })
        .from(quizzes)
        .where(eq(quizzes.id, quizId))
        .limit(1),
    ]);

    const bestScore = submissions.reduce((best, current) => {
      return current.percentageScore > best ? current.percentageScore : best;
    }, 0);

    res.status(200).json({
      success: true,
      data: {
        submissions,
        stats: {
          totalAttempts: submissions.length,
          bestScore,
          hasPassed: submissions.some((s) => s.isPassed),
          lastAttempt: submissions[0]?.submittedAt || null,
        },
        quiz: quizInfo[0] || null, // Include quiz context
      },
    });
  } catch (error) {
    next(error);
  }
};

export const saveQuizProgress = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { sessionId } = req.params;
  const { answers } = req.body;
  const userId = req.user?.userId;

  try {
    if (!sessionId || !userId) {
      const error: ErrorType = new Error(
        "Session ID and user authentication required"
      );
      error.statusCode = 400;
      throw error;
    }

    // Verify session
    const [session] = await db
      .select({
        id: quizSubmissions.id,
        isCompleted: quizSubmissions.isCompleted,
        startedAt: quizSubmissions.startedAt,
        timeLimit: quizzes.timeLimit,
      })
      .from(quizSubmissions)
      .innerJoin(quizzes, eq(quizSubmissions.quizId, quizzes.id))
      .where(
        and(
          eq(quizSubmissions.id, sessionId),
          eq(quizSubmissions.userId, userId),
          eq(quizSubmissions.isCompleted, false)
        )
      );

    if (!session) {
      const error: ErrorType = new Error("Active session not found");
      error.statusCode = 404;
      throw error;
    }

    // Check if session has expired and auto-complete if needed
    const wasExpired = await checkAndCompleteExpiredSession(sessionId, {
      timeLimit: session.timeLimit,
      startedAt: session.startedAt,
      isCompleted: session.isCompleted,
    });

    if (wasExpired) {
      const error: ErrorType = new Error(
        "Quiz session has expired and has been automatically completed"
      );
      error.statusCode = 400;
      throw error;
    }

    res.status(200).json({
      success: true,
      message: "Progress saved successfully",
      data: {
        sessionId,
        savedAt: new Date().toISOString(),
        answersCount: answers.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Check session status and auto-complete if expired
 */
export const checkSessionStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { sessionId } = req.params;
  const userId = req.user?.userId;

  try {
    if (!sessionId || !userId) {
      const error: ErrorType = new Error(
        "Session ID and user authentication required"
      );
      error.statusCode = 400;
      throw error;
    }

    // Get session details
    const [session] = await db
      .select({
        id: quizSubmissions.id,
        isCompleted: quizSubmissions.isCompleted,
        startedAt: quizSubmissions.startedAt,
        submittedAt: quizSubmissions.submittedAt,
        timeLimit: quizzes.timeLimit,
        percentageScore: quizSubmissions.percentageScore,
        isPassed: quizSubmissions.isPassed,
      })
      .from(quizSubmissions)
      .innerJoin(quizzes, eq(quizSubmissions.quizId, quizzes.id))
      .where(
        and(
          eq(quizSubmissions.id, sessionId),
          eq(quizSubmissions.userId, userId)
        )
      );

    if (!session) {
      const error: ErrorType = new Error("Session not found or access denied");
      error.statusCode = 404;
      throw error;
    }

    let wasAutoCompleted = false;

    // Check if session has expired and auto-complete if needed
    if (!session.isCompleted) {
      wasAutoCompleted = await checkAndCompleteExpiredSession(sessionId, {
        timeLimit: session.timeLimit,
        startedAt: session.startedAt,
        isCompleted: session.isCompleted,
      });
    }

    // Calculate time remaining if session is still active
    const timeRemaining =
      session.timeLimit && !session.isCompleted && !wasAutoCompleted
        ? Math.max(
            0,
            session.timeLimit * 60 -
              Math.floor(
                (Date.now() - new Date(session.startedAt).getTime()) / 1000
              )
          )
        : null;

    res.status(200).json({
      success: true,
      data: {
        sessionId: session.id,
        isCompleted: session.isCompleted || wasAutoCompleted,
        wasAutoCompleted,
        timeRemaining,
        startedAt: session.startedAt,
        submittedAt: session.submittedAt,
        ...(session.isCompleted && {
          results: {
            percentageScore: session.percentageScore,
            isPassed: session.isPassed,
          },
        }),
      },
    });
  } catch (error) {
    next(error);
  }
};
