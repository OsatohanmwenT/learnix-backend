import { and, count, eq } from "drizzle-orm";
import { courseEnrollments, lessonCompletions, lessons, modules } from "../database/schemas/content.schema";
import { db } from "../database";

export const calculateCourseProgress = async (
  userId: string,
  courseId: string
): Promise<number> => {
  try {
    const totalLessonsResult = await db
      .select({ count: count() })
      .from(lessons)
      .innerJoin(modules, eq(lessons.moduleId, modules.id))
      .where(eq(modules.courseId, courseId));

    const totalLessons = totalLessonsResult[0]?.count || 0;

    if (totalLessons === 0) {
      return 0;
    }

    const completedLessonsResult = await db
      .select({ count: count() })
      .from(lessonCompletions)
      .innerJoin(lessons, eq(lessonCompletions.lessonId, lessons.id))
      .innerJoin(modules, eq(lessons.moduleId, modules.id))
      .where(
        and(
          eq(lessonCompletions.userId, userId),
          eq(modules.courseId, courseId),
          eq(lessonCompletions.isCompleted, true)
        )
      );

    const completedLessons = completedLessonsResult[0]?.count || 0;

    const progressPercentage = Math.round(
      (completedLessons / totalLessons) * 100
    );
    return progressPercentage;
  } catch (error) {
    console.error("Error calculating course progress:", error);
    return 0;
  }
};

export const updateCourseProgress = async (
  userId: string,
  courseId: string
): Promise<void> => {
  try {
    const progressPercentage = await calculateCourseProgress(userId, courseId);

    await db
      .update(courseEnrollments)
      .set({
        progressPercentage,
        completedAt: progressPercentage === 100 ? new Date() : null,
      })
      .where(
        and(
          eq(courseEnrollments.userId, userId),
          eq(courseEnrollments.courseId, courseId)
        )
      );
  } catch (error) {
    console.error("Error updating course progress:", error);
    throw error;
  }
};