import z from "zod";

export const createModuleSchema = z.object({
    title: z.string().min(2, { message: "Module title must be at least 2 characters long" }).max(100),
    description: z.string().min(10, { message: "Module description must be at least 10 characters long" }).max(500),
    order: z.number().int().min(0, { message: "Module order must be a non-negative integer" }).optional(),
    lessons: z.array(z.object({
        title: z.string().min(2, { message: "Lesson title must be at least 2 characters long" }).max(100).optional(),
        description: z.string().min(10, { message: "Lesson description must be at least 10 characters long" }).max(500).optional(),
        contentType: z.enum(['text', 'video', 'audio', 'image', 'quiz', 'assignment', 'file'], { message: "Invalid content type" }),
        contentData: z.string().optional()
    })).optional()
})

export const updateModuleSchema = createModuleSchema.partial()