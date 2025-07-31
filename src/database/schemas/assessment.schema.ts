import {
  pgTable,
  text,
  varchar,
  timestamp,
  boolean,
  uuid,
  integer,
  index,
} from "drizzle-orm/pg-core";
import { relations } from 'drizzle-orm';
import { lessons } from "./content.schema";
import { users } from "./auth.schema";

import { difficultyEnum, questionTypeEnum } from "./enum.schema";

export const quizzes = pgTable("quizzes", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  lessonId: uuid("lesson_id").references(() => lessons.id, {
    onDelete: "set null",
  }),
  difficulty: difficultyEnum("difficulty").default("intermediate").notNull(),
  maxAttempts: integer("max_attempts").default(3),
  timeLimit: integer("time_limit_minutes"),
  passingScore: integer("passing_score").default(70).notNull(),
  randomizeQuestions: boolean("randomize_questions").default(false).notNull(),
  showCorrectAnswers: boolean("show_correct_answers").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
}, (table) => ([
  index("quizzes_lesson_id_idx").on(table.lessonId),
  index("quizzes_difficulty_idx").on(table.difficulty)
]));

export const questions = pgTable("questions", {
  id: uuid("id").defaultRandom().primaryKey(),
  quizId: uuid("quiz_id")
    .notNull()
    .references(() => quizzes.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  questionType: questionTypeEnum("question_type").notNull(),
  correctAnswer: text("correct_answer"),
  feedback: text("feedback"),
  points: integer("points").default(1).notNull(),
  orderIndex: integer("order_index").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
}, (table) => ([
  index("questions_quiz_id_idx").on(table.quizId),
  index("questions_order_idx").on(table.quizId, table.orderIndex)
]));

export const answerOptions = pgTable("answer_options", {
  id: uuid("id").defaultRandom().primaryKey(),
  questionId: uuid("question_id")
    .notNull()
    .references(() => questions.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  isCorrect: boolean("is_correct").notNull(),
  explanation: text("explanation"),
  orderIndex: integer("order_index").notNull(),
}, (table) => ([
  index("answer_options_question_id_idx").on(table.questionId)
]));

export const quizSubmissions = pgTable("quiz_submissions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  quizId: uuid("quiz_id")
    .notNull()
    .references(() => quizzes.id, { onDelete: "cascade" }),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  submittedAt: timestamp("submitted_at"),
  score: integer("score").notNull().default(0),
  percentageScore: integer("percentage_score").notNull().default(0),
  attemptNumber: integer("attempt_number").notNull().default(1),
  isCompleted: boolean("is_completed").default(false).notNull(),
  isPassed: boolean("is_passed").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ([
  index("quiz_submissions_user_id_idx").on(table.userId),
  index("quiz_submissions_quiz_id_idx").on(table.quizId),
  index("quiz_submissions_submitted_at_idx").on(table.submittedAt)
]));


export const questionResponses = pgTable("question_responses", {
  id: uuid("id").defaultRandom().primaryKey(),
  submissionId: uuid("submission_id")
    .notNull()
    .references(() => quizSubmissions.id, { onDelete: "cascade" }),
  questionId: uuid("question_id")
    .notNull()
    .references(() => questions.id, { onDelete: "cascade" }),
  submittedAnswer: text("submitted_answer"),
  selectedOptionId: uuid("selected_option_id").references(
    () => answerOptions.id,
    { onDelete: "set null" }
  ),
  isCorrect: boolean("is_correct").notNull(),
  pointsEarned: integer("points_earned").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ([
  index("question_responses_submission_id_idx").on(table.submissionId),
  index("question_responses_question_id_idx").on(table.questionId)
]));


export const quizRelations = relations(quizzes, ({ one, many }) => ({
  lesson: one(lessons, {
    fields: [quizzes.lessonId],
    references: [lessons.id],
  }),
  questions: many(questions),
  submissions: many(quizSubmissions),
}));

export const questionRelations = relations(questions, ({ one, many }) => ({
  quiz: one(quizzes, {
    fields: [questions.quizId],
    references: [quizzes.id],
  }),
  answerOptions: many(answerOptions),
  responses: many(questionResponses),
}));

export const answerOptionRelations = relations(answerOptions, ({ one }) => ({
  question: one(questions, {
    fields: [answerOptions.questionId],
    references: [questions.id],
  }),
}));

export const quizSubmissionRelations = relations(quizSubmissions, ({ one, many }) => ({
  user: one(users, {
    fields: [quizSubmissions.userId],
    references: [users.id],
  }),
  quiz: one(quizzes, {
    fields: [quizSubmissions.quizId],
    references: [quizzes.id],
  }),
  questionResponses: many(questionResponses),
}));

export const questionResponseRelations = relations(questionResponses, ({ one }) => ({
  submission: one(quizSubmissions, {
    fields: [questionResponses.submissionId],
    references: [quizSubmissions.id],
  }),
  question: one(questions, {
    fields: [questionResponses.questionId],
    references: [questions.id],
  }),
  selectedOption: one(answerOptions, {
    fields: [questionResponses.selectedOptionId],
    references: [answerOptions.id],
  }),
}));