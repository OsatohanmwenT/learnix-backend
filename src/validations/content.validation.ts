import z from "zod";

export const createContentSchema = z.object({
  title: z
    .string()
    .min(2, { message: "Lesson title must be at least 2 characters long" })
    .max(100)
    .optional(),
  description: z
    .string()
    .min(10, {
      message: "Lesson description must be at least 10 characters long",
    })
    .max(500)
    .optional(),
  order: z.number().min(0),
  contentType: z.enum(
    ["text", "video", "audio", "image", "quiz", "assignment", "file"],
    { message: "Invalid content type" }
  ),
  contentData: z.string().optional(),
});

export const updateContentSchema = z.object({
  title: z
    .string()
    .min(2, { message: "Lesson title must be at least 2 characters long" })
    .max(100)
    .optional(),
  description: z
    .string()
    .min(10, {
      message: "Lesson description must be at least 10 characters long",
    })
    .max(500)
    .optional(),
  contentType: z.enum(
    ["text", "video", "audio", "image", "quiz", "assignment", "file"],
    { message: "Invalid content type" }
  ),
  contentData: z.string().optional(),
});
