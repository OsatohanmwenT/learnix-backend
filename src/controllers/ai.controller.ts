import { NextFunction, Response, Request } from "express";
import { genAIQuestion } from "../services/ai.service";
import { error, jsonFormatter, validateQuestion } from "../utils";
import { db } from "../database";
import {
  answerOptions,
  questions,
  quizzes,
} from "../database/schemas/assessment.schema";
import { lessons } from "../database/schemas/content.schema";
import { eq, desc } from "drizzle-orm";

export const generateAIQuestions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { quizId, lessonTopic, questionCount = 5, lessonId } = req.body;

  try {
    if (!quizId || !lessonTopic?.trim())
      throw error("Quiz ID and topic required", 400);
    if (questionCount < 1 || questionCount > 50)
      throw error("Count must be 1-50", 400);

    const start = performance.now();

    const [quiz, lesson, existing] = await Promise.all([
      db.query.quizzes.findFirst({ where: eq(quizzes.id, quizId) }),
      lessonId
        ? db.query.lessons.findFirst({ where: eq(lessons.id, lessonId) })
        : null,
      db
        .select({ orderIndex: questions.orderIndex })
        .from(questions)
        .where(eq(questions.quizId, quizId))
        .orderBy(desc(questions.orderIndex))
        .limit(1),
    ]);

    if (!quiz) throw error("Quiz not found", 404);

    performance.mark("start");
    const result = await genAIQuestion(questionCount, lessonTopic, lesson);
    performance.mark("end");
    console.log(`AI generation took ${(performance.measure("AI generation", "start", "end").duration)}ms`);

    let responseText = result[0]?.text;
    if (!responseText) {
      const error: ErrorType = new Error("Failed to generate AI questions");
      error.statusCode = 500;
      throw error;
    }

    if (responseText.includes("```json")) {
      responseText = jsonFormatter(responseText);
    }

    let responseData: AIGenerationResponse;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      throw error("Invalid AI response", 500);
    }

    const startingOrderIndex = (existing[0]?.orderIndex || 0) + 1;
    const valid = responseData.questions?.filter(validateQuestion) || [];
    if (!valid.length) throw error("No valid questions", 500);

    const inserted = await db.transaction(async (tx) => {
      const qs = await tx
        .insert(questions)
        .values(
          valid.map((q, i) => ({
            questionType: "multiple_choice" as const,
            quizId,
            text: q.question.trim(),
            correctAnswer: q.correct_answer.trim(),
            orderIndex: startingOrderIndex + i,
            feedback: q.explanation?.trim() || null,
            points: 1,
            isActive: true,
          }))
        )
        .returning();

      const opts = [];
      const results = [];

      for (let i = 0; i < qs.length; i++) {
        const options = valid[i].options.map((opt, idx) => ({
          text: opt.trim(),
          explanation: valid[i].explanation?.trim() || null,
          orderIndex: idx + 1,
          isCorrect: valid[i].correct_answer.trim() === opt.trim(),
          questionId: qs[i].id,
        }));

        opts.push(...options);
        results.push({ ...qs[i], answerOptions: options });
      }

      await tx.insert(answerOptions).values(opts);
      return results;
    });

    const duration = ((performance.now() - start) / 1000).toFixed(1);

    res.json({
      success: true,
      message: `${inserted.length} questions in ${duration}s`,
      data: {
        questionsCount: inserted.length,
        quizId,
        timeSeconds: duration,
        questions: inserted.map((q) => ({
          id: q.id,
          text: q.text,
          orderIndex: q.orderIndex,
          answerOptions: q.answerOptions?.map((opt) => ({
            text: opt.text,
            isCorrect: opt.isCorrect,
          })),
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};
