import z from "zod";

export const createContentSchema = z.object({
    title: z.string().min(2).max(100),
    description: z.string().min(10).max(1000),
    moduleId: z.uuid(),
    userId: z.uuid(),
});

export const updateContentSchema = z.object({
    title: z.string().min(2).max(100).optional(),
    description: z.string().min(10).max(1000).optional(),
    moduleId: z.uuid().optional(),
    userId: z.uuid().optional(),
});
