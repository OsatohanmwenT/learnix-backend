import { NextFunction, Response, Request } from "express";
import { courses } from "../database/schemas/content.schema";
import { db } from "../database";
import { and, count, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { users } from "../database/schemas/auth.schema";
import { checkUserEnrollmentStatus } from "./enrollment.controller";

export const getCourses = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const {
    page = 1,
    limit = 10,
    query,
    sortBy = "createdAt",
    difficulty,
  } = req.query;

  try {
    const offset = (Number(page) - 1) * Number(limit);

    const conditions: any = [];

    if (query) {
      const tokens = String(query).split(" ").filter(Boolean);

      // Search across multiple fields using token-based matching
      const searchConditions = tokens.map((token) =>
        or(
          ilike(courses.title, `%${token}%`),
          ilike(courses.description, `%${token}%`),
          ilike(sql`${courses.difficulty}::text`, `%${token}%`),
          ilike(sql`${courses.status}::text`, `%${token}%`),
          ilike(users.username, `%${token}%`),
          ilike(users.firstName, `%${token}%`),
          ilike(users.lastName, `%${token}%`)
          // Add more fields if available
        )
      );

      conditions.push(and(...searchConditions));
    }

    if (difficulty) {
      conditions.push(
        inArray(
          courses.difficulty,
          (Array.isArray(difficulty) ? difficulty : [difficulty]) as (
            | "beginner"
            | "intermediate"
            | "advanced"
            | "expert"
          )[]
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [{ totalCount }] = await db
      .select({ totalCount: count() })
      .from(courses)
      .leftJoin(users, eq(courses.instructorId, users.id))
      .where(whereClause);

    const allCourses = await db
      .select({
        id: courses.id,
        title: courses.title,
        description: courses.description,
        estimatedHours: courses.estimatedHours,
        thumbnailUrl: courses.thumbnailUrl,
        status: courses.status,
        difficulty: courses.difficulty,
        createdAt: courses.createdAt,
        updatedAt: courses.updatedAt,
        instructorId: courses.instructorId,
        instructorName: sql`concat(${users.firstName}, ' ', ${users.lastName})`,
      })
      .from(courses)
      .leftJoin(users, eq(courses.instructorId, users.id))
      .where(whereClause)
      .orderBy(
        sql`${
          courses[sortBy as keyof typeof courses] ?? courses.createdAt
        } DESC`
      )
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
  const userId = req.user?.userId; // Optional user ID from authentication

  try {
    if (!id) {
      const error: ErrorType = new Error("Course ID is required");
      error.statusCode = 400;
      throw error;
    }

    const [course] = await db.query.courses.findMany({
      where: eq(courses.id, id),
      with: {
        instructor: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
          },
        },
        modules: {
          with: {
            lessons: true,
          },
        },
      },
    });

    if (!course) {
      const error: ErrorType = new Error("Course not found");
      error.statusCode = 404;
      throw error;
    }

    // Check enrollment status if user is authenticated
    let enrollmentInfo = null;
    let isEnrolled = false;

    if (userId) {
      enrollmentInfo = await checkUserEnrollmentStatus(userId, id);
      isEnrolled = !!enrollmentInfo;
    }

    res.json({
      success: true,
      message: "Course retrieved successfully",
      data: {
        course,
        isEnrolled,
        enrollment: enrollmentInfo,
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
