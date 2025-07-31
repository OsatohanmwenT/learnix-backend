import { NextFunction, Request, Response } from "express";
import { courseEnrollments, courses } from "../database/schemas/content.schema";
import { and, eq } from "drizzle-orm";
import { db } from "../database";
import { users } from "../database/schemas/auth.schema";

export const enrollInCourse = async (
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

    if (!userId) {
      const error: ErrorType = new Error("User ID is required");
      error.statusCode = 400;
      throw error;
    }

    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    if (!course) {
      const error: ErrorType = new Error("Course not found");
      error.statusCode = 404;
      throw error;
    }

    if (course.status !== "published") {
      const error: ErrorType = new Error(
        "Course is not available for enrollment"
      );
      error.statusCode = 400;
      throw error;
    }

    const existing = await db
      .select()
      .from(courseEnrollments)
      .where(
        and(
          eq(courseEnrollments.userId, userId),
          eq(courseEnrollments.courseId, id)
        )
      );

    if (existing.length > 0) {
      const error: ErrorType = new Error("Already enrolled in this course");
      error.statusCode = 409;
      throw error;
    }

    const [newEnrollment] = await db
      .insert(courseEnrollments)
      .values({
        userId: userId,
        courseId: id,
      })
      .returning();

    res.json({
      success: true,
      message: "Enrolled in course successfully",
      data: newEnrollment,
    });
  } catch (error) {
    next(error);
  }
};

export const unenrollFromCourse = async (
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

    if (!userId) {
      const error: ErrorType = new Error("User ID is required");
      error.statusCode = 400;
      throw error;
    }

    await db
      .delete(courseEnrollments)
      .where(
        and(
          eq(courseEnrollments.userId, userId),
          eq(courseEnrollments.courseId, id)
        )
      );

    res.json({
      success: true,
      message: "Unenrolled from course successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const getCourseStudents = async (
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

    if (req.user?.role !== "admin" && course.instructorId !== userId) {
      const error: ErrorType = new Error(
        "Not authorized to view course students"
      );
      error.statusCode = 403;
      throw error;
    }

    const students = await db
      .select({
        enrollment: courseEnrollments,
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
        },
      })
      .from(courseEnrollments)
      .leftJoin(users, eq(courseEnrollments.userId, users.id))
      .where(eq(courseEnrollments.courseId, id));

    res.json({
      success: true,
      message: "Course students retrieved successfully",
      data: {
        course: {
          id: course.id,
          title: course.title,
        },
        students,
        totalStudents: students.length,
      },
    });
  } catch (error) {
    next(error);
  }
};