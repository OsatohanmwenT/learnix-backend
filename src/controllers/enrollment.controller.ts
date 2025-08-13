import { NextFunction, Request, Response } from "express";
import {
  courseEnrollments,
  courses,
  lessons,
  lessonCompletions,
  modules,
} from "../database/schemas/content.schema";
import { and, count, desc, eq, sql } from "drizzle-orm";
import { db } from "../database";
import { users } from "../database/schemas/auth.schema";
import { PaymentService } from "../services/payment.service";

const paymentService = new PaymentService();

export const initiateCourseEnrollment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;
  const userId = req.user?.userId;
  const { callback_url } = req.body;

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

    // Get course details
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

    // Check if user is already enrolled
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

    // Get user details for payment
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) {
      const error: ErrorType = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }

    // Check if course is free
    if (!course.price || course.price === 0) {
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
    } else {
      const paymentData = await paymentService.initializeTransaction({
        email: user.email,
        amount: course.price * 100, // Convert to kobo (Paystack uses kobo)
        metadata: {
          courseId: id,
          userId: userId,
          courseName: course.title,
          instructorId: course.instructorId,
          type: "course_enrollment",
        },
        callback_url,
      });

      res.json({
        success: true,
        message: "Payment initialized successfully",
        data: {
          paymentUrl: paymentData.data.authorization_url,
          reference: paymentData.data.reference,
          course: {
            id: course.id,
            title: course.title,
            price: course.price,
          },
        },
      });
    }
  } catch (error) {
    next(error);
    return;
  }
};

export const completeEnrollment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { reference } = req.body;
  const userId = req.user?.userId;

  try {
    if (!reference) {
      const error: ErrorType = new Error("Payment reference is required");
      error.statusCode = 400;
      throw error;
    }

    if (!userId) {
      const error: ErrorType = new Error("User ID is required");
      error.statusCode = 400;
      throw error;
    }

    const paymentVerification = await paymentService.verifyTransaction(
      reference
    );

    console.log(paymentVerification)

    if (
      !paymentVerification.status ||
      paymentVerification.data.status !== "success"
    ) {
      const error: ErrorType = new Error("Payment verification failed");
      error.statusCode = 400;
      throw error;
    }

    const { courseId, userId: paymentUserId } =
      paymentVerification.data.metadata;

    if (paymentUserId !== userId) {
      const error: ErrorType = new Error(
        "Payment verification failed - user mismatch"
      );
      error.statusCode = 403;
      throw error;
    }

    if (paymentUserId !== userId) {
      const error: ErrorType = new Error(
        "Payment verification failed - user mismatch"
      );
      error.statusCode = 403;
      throw error;
    }

    const existing = await db
      .select()
      .from(courseEnrollments)
      .where(
        and(
          eq(courseEnrollments.userId, userId),
          eq(courseEnrollments.courseId, courseId)
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
        courseId: courseId,
        paymentReference: reference,
      })
      .returning();

    const [course] = await db
      .select()
      .from(courses)
      .where(eq(courses.id, courseId));

    console.log(existing, course, newEnrollment)

    res.json({
      success: true,
      message: "Enrolled in course successfully",
      data: {
        enrollment: newEnrollment,
        course: {
          id: course?.id,
          title: course?.title,
        },
        paymentAmount: paymentVerification.data.amount / 100, // Convert back from kobo
      },
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

export const checkEnrollmentStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params; // course id
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

    // Check if course exists
    const [course] = await db
      .select({
        id: courses.id,
        title: courses.title,
        status: courses.status,
      })
      .from(courses)
      .where(eq(courses.id, id));

    if (!course) {
      const error: ErrorType = new Error("Course not found");
      error.statusCode = 404;
      throw error;
    }

    // Check enrollment status
    const [enrollment] = await db
      .select({
        userId: courseEnrollments.userId,
        courseId: courseEnrollments.courseId,
        enrolledAt: courseEnrollments.enrolledAt,
        completedAt: courseEnrollments.completedAt,
        progressPercentage: courseEnrollments.progressPercentage,
        paymentReference: courseEnrollments.paymentReference,
      })
      .from(courseEnrollments)
      .where(
        and(
          eq(courseEnrollments.userId, userId),
          eq(courseEnrollments.courseId, id)
        )
      );

    const isEnrolled = !!enrollment;

    res.json({
      success: true,
      data: {
        courseId: id,
        courseTitle: course.title,
        courseStatus: course.status,
        isEnrolled,
        enrollment: enrollment || null,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Helper function to check enrollment status (can be used internally)
export const checkUserEnrollmentStatus = async (
  userId: string | undefined,
  courseId: string
) => {
  if (!userId || !courseId) {
    return null;
  }

  try {
    const [enrollment] = await db
      .select({
        userId: courseEnrollments.userId,
        courseId: courseEnrollments.courseId,
        enrolledAt: courseEnrollments.enrolledAt,
        completedAt: courseEnrollments.completedAt,
        progressPercentage: courseEnrollments.progressPercentage,
        paymentReference: courseEnrollments.paymentReference,
      })
      .from(courseEnrollments)
      .where(
        and(
          eq(courseEnrollments.userId, userId),
          eq(courseEnrollments.courseId, courseId)
        )
      );

    return enrollment || null;
  } catch (error) {
    return null;
  }
};

export const getUserEnrolledCourses = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userId = req.user?.userId;
  const { page = 1, limit = 10 } = req.query;

  try {
    if (!userId) {
      const error: ErrorType = new Error("User ID is required");
      error.statusCode = 400;
      throw error;
    }

    const offset = (Number(page) - 1) * Number(limit);

    // Get total count of enrolled courses
    const [{ totalCount }] = await db
      .select({ totalCount: count() })
      .from(courseEnrollments)
      .where(eq(courseEnrollments.userId, userId));

    // Get enrolled courses with details
    const enrolledCourses = await db
      .select({
        enrollment: {
          enrolledAt: courseEnrollments.enrolledAt,
          completedAt: courseEnrollments.completedAt,
          progressPercentage: courseEnrollments.progressPercentage,
        },
        course: {
          id: courses.id,
          title: courses.title,
          thumbnailUrl: courses.thumbnailUrl,
        },
        instructor: {
          firstName: users.firstName,
          lastName: users.lastName,
        },
      })
      .from(courseEnrollments)
      .leftJoin(courses, eq(courseEnrollments.courseId, courses.id))
      .leftJoin(users, eq(courses.instructorId, users.id))
      .where(eq(courseEnrollments.userId, userId))
      .limit(Number(limit))
      .offset(offset);

    // Get lesson counts and completion status for each course
    const coursesWithLessonData = await Promise.all(
      enrolledCourses.map(async (item) => {
        if (!item.course?.id) {
          return {
            ...item,
            course: {
              ...item.course,
              totalLessons: 0,
              completedLessons: 0,
            },
            instructor: {
              name: item.instructor
                ? `${item.instructor.firstName || ""} ${
                    item.instructor.lastName || ""
                  }`.trim()
                : "Unknown Instructor",
            },
            nextLessonId: null,
          };
        }

        // Get total lessons count for the course
        const [{ totalLessons }] = await db
          .select({ totalLessons: count() })
          .from(lessons)
          .leftJoin(modules, eq(lessons.moduleId, modules.id))
          .where(eq(modules.courseId, item.course.id));

        // Get completed lessons count for the user
        const [{ completedLessons }] = await db
          .select({ completedLessons: count() })
          .from(lessonCompletions)
          .leftJoin(lessons, eq(lessonCompletions.lessonId, lessons.id))
          .leftJoin(modules, eq(lessons.moduleId, modules.id))
          .where(
            and(
              eq(modules.courseId, item.course.id),
              eq(lessonCompletions.userId, userId),
              eq(lessonCompletions.isCompleted, true)
            )
          );

        // Get next lesson ID
        let nextLessonId = null;

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
              eq(modules.courseId, item.course.id),
              eq(lessonCompletions.isCompleted, true)
            )
          )
          .orderBy(desc(modules.order), desc(lessons.order))
          .limit(1);

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
                eq(modules.courseId, item.course.id),
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
            .where(eq(modules.courseId, item.course.id))
            .orderBy(modules.order, lessons.order)
            .limit(1);

          nextLessonId = firstLesson.length > 0 ? firstLesson[0].id : null;
        }

        return {
          ...item,
          course: {
            ...item.course,
            totalLessons: totalLessons || 0,
            completedLessons: completedLessons || 0,
          },
          instructor: {
            name: item.instructor
              ? `${item.instructor.firstName || ""} ${
                  item.instructor.lastName || ""
                }`.trim()
              : "Unknown Instructor",
          },
          nextLessonId,
        };
      })
    );

    res.json({
      success: true,
      message: "Enrolled courses retrieved successfully",
      data: {
        courses: coursesWithLessonData.map((item) => ({
          id: item.course?.id || "",
          title: item.course?.title || "Unknown Course",
          thumbnailUrl: item.course?.thumbnailUrl || null,
          progress: item.enrollment.progressPercentage || 0,
          completedLessons: (item.course as any)?.completedLessons || 0,
          totalLessons: (item.course as any)?.totalLessons || 0,
          instructorName: item.instructor.name,
          enrolledAt: item.enrollment.enrolledAt,
          completedAt: item.enrollment.completedAt,
          nextLessonId: (item as any).nextLessonId,
        })),
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(totalCount / Number(limit)),
          totalCourses: totalCount,
          hasNextPage: offset + Number(limit) < totalCount,
          hasPreviousPage: Number(page) > 1,
          limit: Number(limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
