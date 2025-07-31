import { z } from "zod";

export const createQuizSchema = z.object({
  title: z
    .string()
    .min(2, { message: "Quiz title must be at least 2 characters long" })
    .max(255, { message: "Quiz title must not exceed 255 characters" }),
  description: z
    .string()
    .min(10, {
      message: "Quiz description must be at least 10 characters long",
    })
    .max(1000, { message: "Quiz description must not exceed 1000 characters" }),
  lessonId: z.uuid({ message: "Invalid lesson ID format" }).optional(),
  difficulty: z
    .enum(["beginner", "intermediate", "advanced", "expert"], {
      message:
        "Difficulty must be one of: beginner, intermediate, advanced, expert",
    })
    .optional()
    .default("intermediate"),
  maxAttempts: z
    .number()
    .int({ message: "Max attempts must be an integer" })
    .min(1, { message: "Max attempts must be at least 1" })
    .max(10, { message: "Max attempts cannot exceed 10" })
    .optional()
    .default(1),
  timeLimit: z
    .number()
    .int({ message: "Time limit must be an integer" })
    .min(1, { message: "Time limit must be at least 1 minute" })
    .max(480, { message: "Time limit cannot exceed 8 hours (480 minutes)" })
    .optional(),
  passingScore: z
    .number()
    .int({ message: "Passing score must be an integer" })
    .min(0, { message: "Passing score must be at least 0" })
    .max(100, { message: "Passing score cannot exceed 100" })
    .optional()
    .default(70),
  randomizeQuestions: z.boolean().optional().default(false),
  showCorrectAnswers: z.boolean().optional().default(true),
});

export const updateQuizSchema = z
  .object({
    title: z
      .string()
      .min(2, { message: "Quiz title must be at least 2 characters long" })
      .max(255, { message: "Quiz title must not exceed 255 characters" })
      .optional(),
    description: z
      .string()
      .min(10, {
        message: "Quiz description must be at least 10 characters long",
      })
      .max(1000, {
        message: "Quiz description must not exceed 1000 characters",
      })
      .optional(),
    lessonId: z
      .uuid({ message: "Invalid lesson ID format" })
      .optional(),
    difficulty: z
      .enum(["beginner", "intermediate", "advanced", "expert"], {
        message:
          "Difficulty must be one of: beginner, intermediate, advanced, expert",
      })
      .optional(),
    maxAttempts: z
      .number()
      .int({ message: "Max attempts must be an integer" })
      .min(1, { message: "Max attempts must be at least 1" })
      .max(10, { message: "Max attempts cannot exceed 10" })
      .optional(),
    timeLimit: z
      .number()
      .int({ message: "Time limit must be an integer" })
      .min(1, { message: "Time limit must be at least 1 minute" })
      .max(480, { message: "Time limit cannot exceed 8 hours (480 minutes)" })
      .optional(),
    passingScore: z
      .number()
      .int({ message: "Passing score must be an integer" })
      .min(0, { message: "Passing score must be at least 0" })
      .max(100, { message: "Passing score cannot exceed 100" })
      .optional(),
    randomizeQuestions: z.boolean().optional(),
    showCorrectAnswers: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

export const quizQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : 1))
    .refine((val) => val > 0, { message: "Page must be a positive number" }),

  limit: z
    .string()
    .optional()
    .transform((val) => (val ? Math.min(parseInt(val), 100) : 10))
    .refine((val) => val > 0 && val <= 100, {
      message: "Limit must be between 1 and 100",
    }),

  difficulty: z
    .enum(["beginner", "intermediate", "advanced", "expert"])
    .optional(),

  isAdaptive: z
    .string()
    .optional()
    .transform((val) => val === "true")
    .pipe(z.boolean()),
});
