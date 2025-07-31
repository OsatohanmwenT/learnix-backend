import { NextFunction, Request, Response } from "express";
import { db } from "../database";
import { eq } from "drizzle-orm";
import { modules, lessons } from "../database/schemas/content.schema";

export const getModules = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    try {
        if(!id) {
            const error: ErrorType = new Error("Course ID is required");
            error.statusCode = 400;
            throw error;
        }

        const courseModules = await db.select().from(modules).where(eq(modules.courseId, id))

        if (!courseModules || courseModules.length === 0) {
            const error: ErrorType = new Error("No modules found for this course");
            error.statusCode = 404;
            throw error;
        }

        res.json({
            success: true,
            message: "Modules retrieved successfully",
            data: courseModules
        });
    } catch (error) {
        next(error);
    }
}

export const getModuleById = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    try {
        if (!id) {
            const error: ErrorType = new Error("Module ID is required");
            error.statusCode = 400;
            throw error;
        }

        const [module] = await db.select().from(modules).where(eq(modules.id, id));

        if (!module) {
            const error: ErrorType = new Error("Module not found");
            error.statusCode = 404;
            throw error;
        }

        res.json({
            success: true,
            message: "Module retrieved successfully",
            data: module
        });
    } catch (error) {
        next(error);
    }
}

export const createModule = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { title, description, order = 0 } = req.body;

    try {
        if (!id) {
            const error: ErrorType = new Error("Course ID is required");
            error.statusCode = 400;
            throw error;
        }

        if (!title || !description) {
            const error: ErrorType = new Error("Title and description are required");
            error.statusCode = 400;
            throw error;
        }

        const [newModule] = await db.insert(modules).values({
            courseId: id,
            title,
            description,
            order
        }).returning();

        res.json({
            success: true,
            message: "Module created successfully",
            data: newModule
        });
    } catch (error) {
        next(error);
    }
}

export const updateModule = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { title, description } = req.body;

    try {
        if (!id) {
            const error: ErrorType = new Error("Course ID and Module ID are required");
            error.statusCode = 400;
            throw error;
        }

        const existingModule = await db.select().from(modules).where(eq(modules.id, id));

        if (existingModule.length === 0) {
            const error: ErrorType = new Error("Module not found");
            error.statusCode = 404;
            throw error;
        }

        const [updatedModule] = await db.update(modules)
            .set({ title, description })
            .where(eq(modules.id, id))
            .returning();

        res.json({
            success: true,
            message: "Module updated successfully",
            data: updatedModule
        });
    } catch (error) {
        next(error);
    }
}

export const deleteModule = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    try {
        if (!id) {
            const error: ErrorType = new Error("Course ID and Module ID are required");
            error.statusCode = 400;
            throw error;
        }

        const existingModule = await db.select().from(modules).where(eq(modules.id, id));

        if (existingModule.length === 0) {
            const error: ErrorType = new Error("Module not found");
            error.statusCode = 404;
            throw error;
        }

        await db.delete(modules).where(eq(modules.id, id));

        res.json({
            success: true,
            message: "Module deleted successfully"
        });
    } catch (error) {
        next(error);
    }
}

export const getModuleContent = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  try {
    if (!id) {
      const error: ErrorType = new Error("Module ID is required");
      error.statusCode = 400;
      throw error;
    }
    const moduleLessons = await db
      .select()
      .from(lessons)
      .where(eq(lessons.moduleId, id));
    res.json({
      success: true,
      message: "Module content retrieved successfully",
      data: moduleLessons,
    });
  } catch (error) {
    next(error);
  }
};

export const createModuleContent = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const { title, description, contentType, contentData, order, durationMinutes } = req.body;

  try {
    if (!id || !title || !contentType) {
      const error: ErrorType = new Error("Module ID, title, and contentType are required");
      error.statusCode = 400;
      throw error;
    }
    const [newLesson] = await db
      .insert(lessons)
      .values({
        moduleId: id,
        title,
        description,
        contentType,
        contentData,
        order,
        durationMinutes,
      })
      .returning();
    res.status(201).json({
      success: true,
      message: "Module content created successfully",
      data: newLesson,
    });
  } catch (error) {
    next(error);
  }
};