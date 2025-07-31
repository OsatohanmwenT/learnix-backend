import { NextFunction, Request, Response } from "express";
import { db } from "../database";
import {
  courseEnrollments,
  courses,
  lessons,
  modules,
  lessonCompletions,
} from "../database/schemas/content.schema";
import { users } from "../database/schemas/auth.schema";
import { eq, count, desc, sql } from "drizzle-orm";

interface ErrorType extends Error {
  statusCode?: number;
}

export const getCourseStatistics = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { courseId } = req.params;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!courseId) {
      const error: ErrorType = new Error("Course ID is required");
      error.statusCode = 400;
      throw error;
    }

    const course = await db
      .select()
      .from(courses)
      .where(eq(courses.id, courseId))
      .limit(1);

    if (!course.length) {
      const error: ErrorType = new Error("Course not found");
      error.statusCode = 404;
      throw error;
    }

    if (userRole !== "admin" && course[0].instructorId !== userId) {
      const error: ErrorType = new Error(
        "You are not authorized to view these statistics"
      );
      error.statusCode = 403;
      throw error;
    }

    const enrollmentStats = await db
      .select({
        totalEnrollments: count(),
        completedCourses: sql<number>`COUNT(CASE WHEN completed_at IS NOT NULL THEN 1 END)`,
        averageProgress: sql<number>`ROUND(AVG(progress_percentage), 2)`,
      })
      .from(courseEnrollments)
      .where(eq(courseEnrollments.courseId, courseId));

    const lessonStats = await db
      .select({
        totalLessons: count(),
      })
      .from(lessons)
      .innerJoin(modules, eq(lessons.moduleId, modules.id))
      .where(eq(modules.courseId, courseId));

    const topStudents = await db
      .select({
        userId: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        progressPercentage: courseEnrollments.progressPercentage,
        enrolledAt: courseEnrollments.enrolledAt,
        completedAt: courseEnrollments.completedAt,
      })
      .from(courseEnrollments)
      .innerJoin(users, eq(courseEnrollments.userId, users.id))
      .where(eq(courseEnrollments.courseId, courseId))
      .orderBy(desc(courseEnrollments.progressPercentage))
      .limit(10);

    const recentCompletions = await db
      .select({
        studentName: sql<string>`${users.firstName} || ' ' || ${users.lastName}`,
        lessonTitle: lessons.title,
        moduleTitle: modules.title,
        completedAt: lessonCompletions.completedAt,
      })
      .from(lessonCompletions)
      .innerJoin(lessons, eq(lessonCompletions.lessonId, lessons.id))
      .innerJoin(modules, eq(lessons.moduleId, modules.id))
      .innerJoin(users, eq(lessonCompletions.userId, users.id))
      .where(eq(modules.courseId, courseId))
      .orderBy(desc(lessonCompletions.completedAt))
      .limit(20);

    res.json({
      success: true,
      data: {
        course: {
          id: course[0].id,
          title: course[0].title,
          description: course[0].description,
        },
        statistics: {
          totalEnrollments: enrollmentStats[0]?.totalEnrollments || 0,
          completedCourses: enrollmentStats[0]?.completedCourses || 0,
          averageProgress: enrollmentStats[0]?.averageProgress || 0,
          totalLessons: lessonStats[0]?.totalLessons || 0,
          completionRate:
            enrollmentStats[0]?.totalEnrollments > 0
              ? Math.round(
                  (enrollmentStats[0]?.completedCourses /
                    enrollmentStats[0]?.totalEnrollments) *
                    100
                )
              : 0,
        },
        topStudents,
        recentCompletions,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get overall platform analytics for admins
export const getPlatformAnalytics = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userRole = req.user?.role;

    if (userRole !== "admin") {
      const error: ErrorType = new Error("Admin access required");
      error.statusCode = 403;
      throw error;
    }

    // Get overall statistics
    const overallStats = await Promise.all([
      // Total users
      db.select({ count: count() }).from(users),

      // Total courses
      db.select({ count: count() }).from(courses),

      // Total enrollments
      db.select({ count: count() }).from(courseEnrollments),

      // Completed courses
      db
        .select({ count: count() })
        .from(courseEnrollments)
        .where(sql`completed_at IS NOT NULL`),

      // Average progress across all enrollments
      db
        .select({
          avgProgress: sql<number>`ROUND(AVG(progress_percentage), 2)`,
        })
        .from(courseEnrollments),
    ]);

    // Get course performance data
    const coursePerformance = await db
      .select({
        courseId: courses.id,
        courseTitle: courses.title,
        instructorName: sql<string>`${users.firstName} || ' ' || ${users.lastName}`,
        totalEnrollments: count(courseEnrollments.userId),
        averageProgress: sql<number>`ROUND(AVG(${courseEnrollments.progressPercentage}), 2)`,
        completedStudents: sql<number>`COUNT(CASE WHEN ${courseEnrollments.completedAt} IS NOT NULL THEN 1 END)`,
      })
      .from(courses)
      .leftJoin(courseEnrollments, eq(courses.id, courseEnrollments.courseId))
      .leftJoin(users, eq(courses.instructorId, users.id))
      .groupBy(courses.id, courses.title, users.firstName, users.lastName)
      .orderBy(desc(count(courseEnrollments.userId)))
      .limit(10);

    res.json({
      success: true,
      data: {
        overview: {
          totalUsers: overallStats[0][0]?.count || 0,
          totalCourses: overallStats[1][0]?.count || 0,
          totalEnrollments: overallStats[2][0]?.count || 0,
          completedCourses: overallStats[3][0]?.count || 0,
          averageProgress: overallStats[4][0]?.avgProgress || 0,
          completionRate:
            overallStats[2][0]?.count > 0
              ? Math.round(
                  (overallStats[3][0]?.count / overallStats[2][0]?.count) * 100
                )
              : 0,
        },
        topCourses: coursePerformance,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get instructor's course analytics
export const getInstructorAnalytics = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId) {
      const error: ErrorType = new Error("User ID is required");
      error.statusCode = 400;
      throw error;
    }

    if (userRole !== "instructor" && userRole !== "admin") {
      const error: ErrorType = new Error("Instructor or admin access required");
      error.statusCode = 403;
      throw error;
    }

    // Get instructor's courses with statistics
    const instructorCourses = await db
      .select({
        courseId: courses.id,
        courseTitle: courses.title,
        courseDescription: courses.description,
        totalEnrollments: count(courseEnrollments.userId),
        averageProgress: sql<number>`ROUND(AVG(${courseEnrollments.progressPercentage}), 2)`,
        completedStudents: sql<number>`COUNT(CASE WHEN ${courseEnrollments.completedAt} IS NOT NULL THEN 1 END)`,
        createdAt: courses.createdAt,
      })
      .from(courses)
      .leftJoin(courseEnrollments, eq(courses.id, courseEnrollments.courseId))
      .where(eq(courses.instructorId, userId))
      .groupBy(
        courses.id,
        courses.title,
        courses.description,
        courses.createdAt
      )
      .orderBy(desc(courses.createdAt));

    // Get total statistics for this instructor
    const totalStats = await db
      .select({
        totalEnrollments: count(courseEnrollments.userId),
        totalCompletions: sql<number>`COUNT(CASE WHEN ${courseEnrollments.completedAt} IS NOT NULL THEN 1 END)`,
        averageProgress: sql<number>`ROUND(AVG(${courseEnrollments.progressPercentage}), 2)`,
      })
      .from(courses)
      .leftJoin(courseEnrollments, eq(courses.id, courseEnrollments.courseId))
      .where(eq(courses.instructorId, userId));

    res.json({
      success: true,
      data: {
        summary: {
          totalCourses: instructorCourses.length,
          totalEnrollments: totalStats[0]?.totalEnrollments || 0,
          totalCompletions: totalStats[0]?.totalCompletions || 0,
          averageProgress: totalStats[0]?.averageProgress || 0,
          completionRate:
            totalStats[0]?.totalEnrollments > 0
              ? Math.round(
                  (totalStats[0]?.totalCompletions /
                    totalStats[0]?.totalEnrollments) *
                    100
                )
              : 0,
        },
        courses: instructorCourses,
      },
    });
  } catch (error) {
    next(error);
  }
};
