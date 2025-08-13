import { NextFunction, Request, Response } from "express";
import { db } from "../database";
import {
  lessonCompletions,
  lessons,
  modules,
  courses,
  courseEnrollments,
} from "../database/schemas/content.schema";
import { eq, and, count, sql } from "drizzle-orm";
import {
  calculateCourseProgress,
  updateCourseProgress,
} from "../services/content.service";

export const getLessonById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    if (!id) {
      const error: ErrorType = new Error("Lesson ID is required");
      error.statusCode = 400;
      throw error;
    }

    const lesson = await db.select().from(lessons).where(eq(lessons.id, id));

    if (!lesson.length) {
      const error: ErrorType = new Error("Lesson not found");
      error.statusCode = 404;
      throw error;
    }

    res.json({
      success: true,
      data: lesson[0],
    });
  } catch (error) {
    next(error);
  }
};

export const updateLessonContent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;
  const { title, description, contentType, contentData } = req.body;

  try {
    const [lesson] = await db.select().from(lessons).where(eq(lessons.id, id));

    if (!lesson) {
      const error: ErrorType = new Error("Lesson not found");
      error.statusCode = 404;
      throw error;
    }
    const updatedLesson = await db
      .update(lessons)
      .set({
        title,
        description,
        contentType,
        contentData,
        updatedAt: new Date(),
      })
      .where(eq(lessons.id, id))
      .returning();

    res.json({
      success: true,
      message: "Lesson content updated successfully",
      data: updatedLesson[0],
    });
  } catch (error) {
    next(error);
  }
};

export const deleteLesson = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;
  try {
    if (!id) {
      const error: ErrorType = new Error("Lesson ID is required");
      error.statusCode = 400;
      throw error;
    }

    const deletedLesson = await db
      .delete(lessons)
      .where(eq(lessons.id, id))
      .returning();

    if (!deletedLesson.length) {
      const error: ErrorType = new Error("Lesson not found");
      error.statusCode = 404;
      throw error;
    }

    res.json({
      success: true,
      message: "Lesson deleted successfully",
      data: deletedLesson[0],
    });
  } catch (error) {
    next(error);
  }
};

export const completeModuleContent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    if (!id) {
      const error: ErrorType = new Error("Lesson ID is required");
      error.statusCode = 400;
      throw error;
    }

    if (!userId) {
      const error: ErrorType = new Error("User ID is required");
      error.statusCode = 400;
      throw error;
    }

    const lessonResult = await db
      .select({
        id: lessons.id,
        courseId: modules.courseId,
      })
      .from(lessons)
      .innerJoin(modules, eq(lessons.moduleId, modules.id))
      .where(eq(lessons.id, id))
      .limit(1);

    if (!lessonResult.length) {
      const error: ErrorType = new Error("Lesson not found");
      error.statusCode = 404;
      throw error;
    }

    const lesson = lessonResult[0];

    const enrollmentCheck = await db
      .select()
      .from(courseEnrollments)
      .where(
        and(
          eq(courseEnrollments.userId, userId),
          eq(courseEnrollments.courseId, lesson.courseId)
        )
      )
      .limit(1);

    if (!enrollmentCheck.length) {
      const error: ErrorType = new Error("You are not enrolled in this course");
      error.statusCode = 403;
      throw error;
    }

    const content = await db
      .insert(lessonCompletions)
      .values({
        lessonId: id,
        userId: userId,
        isCompleted: true,
        completedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [lessonCompletions.userId, lessonCompletions.lessonId],
        set: {
          isCompleted: true,
          completedAt: new Date(),
        },
      })
      .returning();

    await updateCourseProgress(userId, lesson.courseId);

    const updatedProgress = await calculateCourseProgress(
      userId,
      lesson.courseId
    );

    res.json({
      success: true,
      message: "Lesson marked as complete",
      data: {
        completion: content[0],
        courseProgress: updatedProgress,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getCourseProgress = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { courseId } = req.params;
    const userId = req.user?.userId;

    if (!courseId) {
      const error: ErrorType = new Error("Course ID is required");
      error.statusCode = 400;
      throw error;
    }

    if (!userId) {
      const error: ErrorType = new Error("User ID is required");
      error.statusCode = 400;
      throw error;
    }

    const enrollment = await db
      .select()
      .from(courseEnrollments)
      .where(
        and(
          eq(courseEnrollments.userId, userId),
          eq(courseEnrollments.courseId, courseId)
        )
      )
      .limit(1);

    if (!enrollment.length) {
      const error: ErrorType = new Error("You are not enrolled in this course");
      error.statusCode = 403;
      throw error;
    }

    const progressPercentage = await calculateCourseProgress(userId, courseId);

    // Get course details
    const [courseDetails] = await db
      .select({
        id: courses.id,
        title: courses.title,
      })
      .from(courses)
      .where(eq(courses.id, courseId));

    // Get all lessons with completion status
    const allLessonsWithCompletion = await db
      .select({
        lessonId: lessons.id,
        lessonTitle: lessons.title,
        moduleId: modules.id,
        moduleTitle: modules.title,
        isCompleted: sql<boolean>`CASE WHEN ${lessonCompletions.isCompleted} IS TRUE THEN true ELSE false END`,
        completedAt: lessonCompletions.completedAt,
        lessonOrder: lessons.order,
        moduleOrder: modules.order,
      })
      .from(lessons)
      .innerJoin(modules, eq(lessons.moduleId, modules.id))
      .leftJoin(
        lessonCompletions,
        and(
          eq(lessonCompletions.lessonId, lessons.id),
          eq(lessonCompletions.userId, userId)
        )
      )
      .where(eq(modules.courseId, courseId))
      .orderBy(modules.order, lessons.order);

    // Get total lesson count
    const totalLessons = allLessonsWithCompletion.length;
    const completedLessonsCount = allLessonsWithCompletion.filter(
      (lesson) => lesson.isCompleted
    ).length;

    // Group lessons by modules
    const moduleMap = new Map();

    allLessonsWithCompletion.forEach((lesson) => {
      if (!moduleMap.has(lesson.moduleId)) {
        moduleMap.set(lesson.moduleId, {
          id: lesson.moduleId,
          name: lesson.moduleTitle,
          lessons: [],
        });
      }

      moduleMap.get(lesson.moduleId).lessons.push({
        id: lesson.lessonId,
        name: lesson.lessonTitle,
        isCompleted: lesson.isCompleted,
        completedAt: lesson.completedAt,
      });
    });

    const modulesWithLessons = Array.from(moduleMap.values());

    res.json({
      success: true,
      data: {
        course: {
          id: courseDetails.id,
          name: courseDetails.title,
        },
        progressPercentage,
        totalLessons,
        completedLessons: completedLessonsCount,
        isCompleted: progressPercentage === 100,
        completedAt: enrollment[0].completedAt,
        enrolledAt: enrollment[0].enrolledAt,
        modules: modulesWithLessons,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getUserProgress = async (
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

    const enrollments = await db
      .select({
        courseId: courseEnrollments.courseId,
        courseTitle: courses.title,
        courseDescription: courses.description,
        courseThumbnail: courses.thumbnailUrl,
        progressPercentage: courseEnrollments.progressPercentage,
        enrolledAt: courseEnrollments.enrolledAt,
        completedAt: courseEnrollments.completedAt,
        estimatedHours: courses.estimatedHours,
        difficulty: courses.difficulty,
      })
      .from(courseEnrollments)
      .innerJoin(courses, eq(courseEnrollments.courseId, courses.id))
      .where(eq(courseEnrollments.userId, userId))
      .orderBy(courseEnrollments.enrolledAt);

    res.json({
      success: true,
      data: {
        enrollments,
        totalEnrollments: enrollments.length,
        completedCourses: enrollments.filter((e) => e.completedAt !== null)
          .length,
        inProgressCourses: enrollments.filter(
          (e) => e.progressPercentage > 0 && e.progressPercentage < 100
        ).length,
      },
    });
  } catch (error) {
    next(error);
  }
};
