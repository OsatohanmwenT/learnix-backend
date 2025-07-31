import { NextFunction, Response, Request } from "express";
import {
  courses,
} from "../database/schemas/content.schema";
import { db } from "../database";
import { and, count, eq, ilike, or } from "drizzle-orm";

export const getCourses = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { page = 1, limit = 10, search } = req.query;

  try {
    const offset = (Number(page) - 1) * Number(limit);

    const conditions: any = [];

    if (search) {
      conditions.push(
        or(
          ilike(courses.title, `%${search}%`),
          ilike(courses.description, `%${search}%`)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [{ totalCount }] = await db
      .select({ totalCount: count() })
      .from(courses)
      .where(whereClause);

    const allCourses = await db
      .select()
      .from(courses)
      .where(whereClause)
      .limit(Number(limit))
      .offset(offset);

    res.json({
      success: true,
      message: "Courses retrieved successfully",
      data: {
        courses: allCourses,
        totalCount,
        totalCourses: totalCount,
        currentPage: Number(page),
        totalPages: Math.ceil(totalCount / Number(limit)),
        hasPreviousPage: Number(page) > 1,
        hasNextPage: offset + Number(limit) < totalCount,
        limit: Number(limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getCourseById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;
  try {
    if (!id) {
      const error: ErrorType = new Error("Course ID is required");
      error.statusCode = 400;
      throw error;
    }

    const [course] = await db.query.courses.findMany({
      where: eq(courses.id, id),
      with: {
        modules: {
          with: {
            lessons: true,
          },
        },
      },
    })

    res.json({
      success: true,
      message: "Course retrieved successfully",
      data: {
        ...course
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createCourse = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const {
    title,
    description,
    estimatedHours,
    thumbnailUrl,
    status,
    difficulty,
  } = req.body;
  const userId = req.user?.userId;

  try {
    if (
      !title ||
      !description ||
      !estimatedHours ||
      !thumbnailUrl ||
      !status ||
      !difficulty ||
      !userId
    ) {
      const error: ErrorType = new Error("All fields are required");
      error.statusCode = 400;
      throw error;
    }

    const createdCourse = await db
        .insert(courses)
        .values({
          title,
          description,
          estimatedHours,
          thumbnailUrl,
          status,
          difficulty,
          instructorId: userId,
        })
        .returning();


    res.status(201).json({
      success: true,
      message: "Course created successfully",
      data: createdCourse,
    });
  } catch (error) {
    next(error);
  }
};

export const updateCourse = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;
  const {
    title,
    description,
    estimatedHours,
    thumbnailUrl,
    status,
    difficulty,
  } = req.body;
  const userId = req.user?.userId;

  try {
    if (!id) {
      const error: ErrorType = new Error("Course ID is required");
      error.statusCode = 400;
      throw error;
    }

    const [course] = await db.select().from(courses).where(eq(courses.id, id));

    if (!course) {
      const error: ErrorType = new Error("Course not found");
      error.statusCode = 404;
      throw error;
    }

    if (course.instructorId !== userId) {
      const error: ErrorType = new Error(
        "You are not authorized to update this course"
      );
      error.statusCode = 403;
      throw error;
    }

    const updatedCourse = await db
      .update(courses)
      .set({
        title,
        description,
        estimatedHours,
        thumbnailUrl,
        status,
        difficulty,
        instructorId: userId,
      })
      .where(eq(courses.id, id))
      .returning();

    res.json({
      success: true,
      message: "Course updated successfully",
      data: updatedCourse,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCourse = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;
  const userId = req.user?.userId;

  try {
    if (!id) {
      const error: ErrorType = new Error("Course ID is required");
      error.statusCode = 400;
      throw error;
    }

    const [course] = await db.select().from(courses).where(eq(courses.id, id));

    if (!course) {
      const error: ErrorType = new Error("Course not found");
      error.statusCode = 404;
      throw error;
    }

    if (course.instructorId !== userId) {
      const error: ErrorType = new Error(
        "You are not authorized to delete this course"
      );
      error.statusCode = 403;
      throw error;
    }

    await db.delete(courses).where(eq(courses.id, id));

    res.json({
      success: true,
      message: "Course deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};