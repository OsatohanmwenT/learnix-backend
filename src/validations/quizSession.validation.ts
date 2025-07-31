import { z } from "zod";

const questionAnswerSchema = z.object({
  questionId: z.uuid("Invalid question ID"),
  selectedOptionId: z.uuid().optional(),
  submittedAnswer: z.string().optional(),
});

export const submitQuizSchema = z.object({
    sessionId: z.uuid("Invalid session ID"),
    answers: z.array(questionAnswerSchema),
    timeSpent: z.number().int().min(0).optional(),
});

export const saveProgressSchema = z.object({
  body: z.object({
    answers: z.array(questionAnswerSchema),
  }),
});
