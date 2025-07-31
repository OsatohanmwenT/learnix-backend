import { GoogleGenAI } from "@google/genai";
import { db } from "../database";
import { quizSubmissions } from "../database/schemas/assessment.schema";
import { eq, desc, gte, and } from "drizzle-orm";
import { jsonFormatter } from "../utils";

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_AI_API_KEY,
});

export const generateLearningInsights = async (userId: string) => {
  try {
    // Get recent quiz data (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentQuizzes = await db
      .select()
      .from(quizSubmissions)
      .where(
        and(
          eq(quizSubmissions.userId, userId),
          gte(quizSubmissions.submittedAt, thirtyDaysAgo),
          eq(quizSubmissions.isCompleted, true)
        )
      )
      .orderBy(desc(quizSubmissions.submittedAt))
      .limit(20);

    const scores = recentQuizzes.map((q) => q.percentageScore);
    const averageScore =
      scores.length > 0
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : 0;

    // Generate simple AI insights
    const insights = await generateSimpleInsights(
      scores,
      averageScore,
      recentQuizzes.length
    );

    return {
      insights,
      stats: {
        totalQuizzes: recentQuizzes.length,
        averageScore,
        recentScores: scores.slice(-5),
      },
    };
  } catch (error) {
    console.error("Error generating insights:", error);
    return {
      insights: [
        {
          type: "performance",
          message: "Keep practicing! Every quiz helps you improve.",
        },
      ],
      stats: { totalQuizzes: 0, averageScore: 0, recentScores: [] },
    };
  }
};

const generateSimpleInsights = async (
  scores: number[],
  averageScore: number,
  totalQuizzes: number
) => {
  if (totalQuizzes === 0) {
    return [
      {
        type: "recommendation",
        message: "Take your first quiz to start getting personalized insights!",
      },
    ];
  }

  const prompt = `
Generate 2-3 encouraging learning insights for a student with:
- ${totalQuizzes} quizzes completed
- ${averageScore}% average score  
- Recent scores: [${scores.slice(-5).join(", ")}]

Return JSON array with objects having 'type' and 'message' fields.
Types: 'performance', 'encouragement', 'recommendation'
Keep messages friendly and under 80 characters.
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: [{ parts: [{ text: prompt }] }],
    });

    const responseText =
      response.candidates?.[0]?.content?.parts?.[0]?.text || "";
    return JSON.parse(jsonFormatter(responseText));
  } catch (error) {
    // Simple fallback
    console.log(error)
    return [
      {
        type: "performance",
        message: `Great work! You've completed ${totalQuizzes} quizzes with ${averageScore}% average.`,
      },
    ];
  }
};
