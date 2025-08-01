import { boolean, index, integer, pgEnum, pgTable, primaryKey, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { users } from "./auth.schema";
import { difficultyEnum } from "./enum.schema";
import { is, relations } from "drizzle-orm";
import { quizzes } from "./assessment.schema";

export const courseStatusEnum = pgEnum('course_status', ['draft', 'published', 'archived']);
export const contentTypeEnum = pgEnum('content_type', ['text', 'video', 'audio', 'image', 'quiz', 'assignment', 'file']);

export const courses = pgTable("courses", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description"),
  price: integer('price').default(0),
  thumbnailUrl: text("thumbnail_url"),
  estimatedHours: integer('estimated_hours'),
  status: courseStatusEnum('status').default('draft').notNull(),
  difficulty: difficultyEnum('difficulty').default('beginner').notNull(),
  instructorId: uuid("instructor_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
});

export const modules = pgTable('modules', {
  id: uuid('id').defaultRandom().primaryKey(),
  courseId: uuid('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  order: integer('order').notNull(), // Order within the course
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
});

export const lessons = pgTable('lessons', {
  id: uuid('id').defaultRandom().primaryKey(),
  moduleId: uuid('module_id').notNull().references(() => modules.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  contentType: contentTypeEnum('content_type').notNull(),
  contentData: text('content_data'), // Stores actual text content, or URL to media/file
  order: integer('order').notNull(), // Order within the module
  durationMinutes: integer('duration_minutes'), // Estimated duration for text/quiz, actual for video/audio
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
});

export const courseEnrollments = pgTable('course_enrollments', {
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  courseId: uuid('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
  enrolledAt: timestamp('enrolled_at').defaultNow().notNull(),
  paymentReference: text('payment_reference'),
  completedAt: timestamp('completed_at'),
  progressPercentage: integer('progress_percentage').default(0).notNull(), // 0-100
}, (table) => {
  return [
    primaryKey({ columns: [table.userId, table.courseId] }),
    index('enrollments_user_id_idx').on(table.userId),
    index('enrollments_course_id_idx').on(table.courseId),
    index('enrollments_enrolled_at_idx').on(table.enrolledAt),
  ];
});

export const lessonCompletions = pgTable('lesson_completions', {
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  lessonId: uuid('lesson_id').notNull().references(() => lessons.id, { onDelete: 'cascade' }),
  completedAt: timestamp('completed_at').defaultNow().notNull(),
  isCompleted: boolean('is_completed').default(false).notNull(),
}, (table) => {
  return [
    primaryKey({ columns: [table.userId, table.lessonId] }),
  ];
});

export const coursesRelations = relations(courses, ({ one, many }) => ({
  instructor: one(users, {
    fields: [courses.instructorId],
    references: [users.id],
  }),
  modules: many(modules),
  enrollments: many(courseEnrollments),
  // learningPaths: many(learningPaths),
}));

export const modulesRelations = relations(modules, ({ one, many }) => ({
  course: one(courses, {
    fields: [modules.courseId],
    references: [courses.id],
  }),
  lessons: many(lessons),
}));

export const lessonsRelations = relations(lessons, ({ one, many }) => ({
  module: one(modules, {
    fields: [lessons.moduleId],
    references: [modules.id],
  }),
  completions: many(lessonCompletions),
  quizzes: many(quizzes),
}));

export const courseEnrollmentsRelations = relations(courseEnrollments, ({ one }) => ({
  user: one(users, {
    fields: [courseEnrollments.userId],
    references: [users.id],
  }),
  course: one(courses, {
    fields: [courseEnrollments.courseId],
    references: [courses.id],
  }),
}));

export const lessonCompletionsRelations = relations(lessonCompletions, ({ one }) => ({
  user: one(users, {
    fields: [lessonCompletions.userId],
    references: [users.id],
  }),
  lesson: one(lessons, {
    fields: [lessonCompletions.lessonId],
    references: [lessons.id],
  }),
}));