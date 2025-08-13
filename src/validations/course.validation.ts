import z from "zod";

export const createCourseSchema = z.object({
    title: z.string().min(2, { message: "Title must be at least 2 characters long" }).max(100),
    description: z.string().min(10, { message: "Description must be at least 10 characters long" }).max(500),
    category: z.string().min(2, { message: "Category must be at least 2 characters long" }).max(100),
    estimatedHours: z.number().min(1, { message: "Estimated hours must be at least 1 hour" }),
    thumbnailUrl: z.string({ message: "Invalid URL format" }),
    status: z.enum(['draft', 'published', 'archived'], { message: "Invalid course status" }),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced', 'expert'], { message: "Invalid difficulty level" }),
})

export const updateCourseSchema = createCourseSchema.partial()