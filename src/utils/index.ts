import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { NextFunction, Request, Response } from "express";
import { ZodSchema } from "zod";

dotenv.config();

export const createAccessToken = (payload: any) => {
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: "15m",
  });
};

export const createRefreshToken = (payload: any) => {
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: "7d",
  });
};

export const verifyToken = (
  token: string | undefined
): AccessTokenPayload | null => {
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as AccessTokenPayload;
  } catch (error) {
    return null;
  }
};

export const validate =
  (schema: ZodSchema) => (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      next(error);
    }
  };

export const jsonFormatter = (text: string | undefined) => {
  if (!text) return "";
  return text
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();
};

export const validateQuestion = (
  response: AIQuestionResponse,
  index: number
): boolean => {
  if (
    !response.question?.trim() ||
    !Array.isArray(response.options) ||
    !response.correct_answer?.trim()
  ) {
    return false;
  }
  return response.options.includes(response.correct_answer);
};

export const error = (msg: string, code: number): ErrorType => {
  const e: ErrorType = new Error(msg);
  e.statusCode = code;
  return e;
};

export const getOptimizedPrompt = (
  questionNum: number,
  lessonTopic: string,
  lesson?: any
) => {
  let lessonContext = "Generate general questions about the topic.";
  if (lesson) {
    const contentParts = [];
    if (lesson.title) contentParts.push(`Title: ${lesson.title}`);
    if (lesson.description)
      contentParts.push(`Description: ${lesson.description}`);
    if (lesson.contentData) {
      const content = lesson.contentData.substring(0, 1500);
      contentParts.push(
        `Content: ${content}${lesson.contentData.length > 1500 ? "..." : ""}`
      );
    }
    lessonContext = contentParts.join("\n");
  }

  const prompt = `
You are an expert quiz creator. Generate ${questionNum} multiple-choice questions about "${lessonTopic}".

Context:
${lessonContext}

Instructions:
- Base questions on the provided context.
- Each question must have 4 options.
- Provide the correct answer and a brief explanation for each.
- Output ONLY a valid JSON object with a "questions" array. No extra text or markdown.

JSON Format:
{
  "questions": [
    {
      "question": "...",
      "options": ["...", "...", "...", "..."],
      "correct_answer": "...",
      "explanation": "..."
    }
  ]
}
`;
  return prompt;
};
