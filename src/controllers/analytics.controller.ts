import { NextFunction, Request, Response } from "express";
import { db } from "../database";
import {
  courseEnrollments,
  courses,
  lessons,
  modules,
  lessonCompletions,
} from "../database/schemas/content.schema";
import {
  quizzes,
  quizSubmissions,
} from "../database/schemas/assessment.schema";
import { users } from "../database/schemas/auth.schema";
import { eq, count, desc, sql, and } from "drizzle-orm";

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
        courseDescription: courses.smallDescription,
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

// Get user's personal statistics
export const getUserStatistics = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      const error: ErrorType = new Error("User ID is required");
      error.statusCode = 400;
      throw error;
    }

    // Get enrolled courses count
    const [enrolledCoursesCount] = await db
      .select({ count: count() })
      .from(courseEnrollments)
      .where(eq(courseEnrollments.userId, userId));

    // Get completed courses count
    const [completedCoursesCount] = await db
      .select({ count: count() })
      .from(courseEnrollments)
      .where(
        and(eq(courseEnrollments.userId, userId), sql`completed_at IS NOT NULL`)
      );

    // Get quiz statistics
    const [quizStats] = await db
      .select({
        totalQuizzesTaken: count(),
        averageScore: sql<number>`ROUND(AVG(percentage_score), 2)`,
        totalQuizzesPassed: sql<number>`COUNT(CASE WHEN is_passed = true THEN 1 END)`,
        highestScore: sql<number>`MAX(percentage_score)`,
      })
      .from(quizSubmissions)
      .where(
        and(
          eq(quizSubmissions.userId, userId),
          eq(quizSubmissions.isCompleted, true)
        )
      );

    // Get recent quiz submissions
    const recentQuizzes = await db
      .select({
        quizTitle: quizzes.title,
        score: quizSubmissions.percentageScore,
        isPassed: quizSubmissions.isPassed,
        submittedAt: quizSubmissions.submittedAt,
        attemptNumber: quizSubmissions.attemptNumber,
      })
      .from(quizSubmissions)
      .innerJoin(quizzes, eq(quizSubmissions.quizId, quizzes.id))
      .where(
        and(
          eq(quizSubmissions.userId, userId),
          eq(quizSubmissions.isCompleted, true)
        )
      )
      .orderBy(desc(quizSubmissions.submittedAt))
      .limit(10);

    // Get course progress details with next lesson ID
    const courseProgress = await db
      .select({
        courseId: courses.id,
        courseTitle: courses.title,
        thumbnailUrl: courses.thumbnailUrl,
        progressPercentage: courseEnrollments.progressPercentage,
        enrolledAt: courseEnrollments.enrolledAt,
        completedAt: courseEnrollments.completedAt,
        instructorName: sql<string>`${users.firstName} || ' ' || ${users.lastName}`,
        numberOfLessons: sql<number>`COUNT(${lessons.id})`,
        numberOfCompletedLessons: sql<number>`COUNT(CASE WHEN ${lessonCompletions.lessonId} IS NOT NULL THEN 1 END)`,
      })
      .from(courseEnrollments)
      .innerJoin(courses, eq(courseEnrollments.courseId, courses.id))
      .leftJoin(users, eq(courses.instructorId, users.id))
      .leftJoin(modules, eq(modules.courseId, courses.id))
      .leftJoin(lessons, eq(lessons.moduleId, modules.id))
      .leftJoin(
        lessonCompletions,
        and(
          eq(lessonCompletions.lessonId, lessons.id),
          eq(lessonCompletions.userId, userId)
        )
      )
      .where(eq(courseEnrollments.userId, userId))
      .groupBy(
        courses.id,
        courses.title,
        courses.thumbnailUrl,
        courseEnrollments.progressPercentage,
        courseEnrollments.enrolledAt,
        courseEnrollments.completedAt,
        users.firstName,
        users.lastName
      )
      .orderBy(desc(courseEnrollments.enrolledAt))
      .limit(5);

    // Get next lesson for each course
    const courseProgressWithNextLesson = await Promise.all(
      courseProgress.map(async (course) => {
        // Get the last completed lesson's order for this course
        const lastCompletedLesson = await db
          .select({
            moduleOrder: modules.order,
            lessonOrder: lessons.order,
          })
          .from(lessonCompletions)
          .innerJoin(lessons, eq(lessonCompletions.lessonId, lessons.id))
          .innerJoin(modules, eq(lessons.moduleId, modules.id))
          .where(
            and(
              eq(lessonCompletions.userId, userId),
              eq(modules.courseId, course.courseId),
              eq(lessonCompletions.isCompleted, true)
            )
          )
          .orderBy(desc(modules.order), desc(lessons.order))
          .limit(1);

        let nextLessonId = null;

        if (lastCompletedLesson.length > 0) {
          // Find the next lesson after the last completed one
          const nextLesson = await db
            .select({
              id: lessons.id,
            })
            .from(lessons)
            .innerJoin(modules, eq(lessons.moduleId, modules.id))
            .where(
              and(
                eq(modules.courseId, course.courseId),
                sql`(${modules.order}, ${lessons.order}) > (${lastCompletedLesson[0].moduleOrder}, ${lastCompletedLesson[0].lessonOrder})`
              )
            )
            .orderBy(modules.order, lessons.order)
            .limit(1);

          nextLessonId = nextLesson.length > 0 ? nextLesson[0].id : null;
        } else {
          // No lessons completed, get the first lesson in the course
          const firstLesson = await db
            .select({
              id: lessons.id,
            })
            .from(lessons)
            .innerJoin(modules, eq(lessons.moduleId, modules.id))
            .where(eq(modules.courseId, course.courseId))
            .orderBy(modules.order, lessons.order)
            .limit(1);

          nextLessonId = firstLesson.length > 0 ? firstLesson[0].id : null;
        }

        return {
          ...course,
          nextLessonId,
        };
      })
    );

    // Calculate completion rate
    const completionRate =
      enrolledCoursesCount.count > 0
        ? Math.round(
            (completedCoursesCount.count / enrolledCoursesCount.count) * 100
          )
        : 0;

    // Calculate quiz pass rate
    const quizPassRate =
      quizStats.totalQuizzesTaken > 0
        ? Math.round(
            (quizStats.totalQuizzesPassed / quizStats.totalQuizzesTaken) * 100
          )
        : 0;
    res.json({
      success: true,
      message: "User statistics retrieved successfully",
      data: {
        overview: {
          enrolledCourses: enrolledCoursesCount.count || 0,
          completedCourses: completedCoursesCount.count || 0,
          completionRate,
          quizzesTaken: quizStats.totalQuizzesTaken || 0,
          averageQuizScore: quizStats.averageScore || 0,
          highestQuizScore: quizStats.highestScore || 0,
          quizzesPassed: quizStats.totalQuizzesPassed || 0,
          quizPassRate,
        },
        recentActivity: {
          recentQuizzes,
          courseProgress: courseProgressWithNextLesson,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
