import { relations } from "drizzle-orm";
import { boolean, decimal, integer, pgEnum, pgTable, serial, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { courseEnrollments, lessonCompletions } from "./content.schema";
import { quizSubmissions } from "./assessment.schema";

export const userRoleEnum = pgEnum("user_role", ["learner", "instructor", "admin"]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: varchar("username", { length: 50 }).unique().notNull(),
  firstName: varchar("first_name", { length: 50 }).notNull(),
  lastName: varchar("last_name", { length: 50 }).notNull(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  password: varchar("password", { length: 255 }).notNull(),
  role: userRoleEnum("role").default("learner").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  refreshToken: text("refresh_token").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const instructorBankDetails = pgTable("instructor_bank_details", {
  id: serial("id").primaryKey(),
  instructorId: varchar("instructor_id", { length: 255 }).notNull(),
  accountNumber: varchar("account_number", { length: 20 }).notNull(),
  bankCode: varchar("bank_code", { length: 10 }).notNull(),
  bankName: varchar("bank_name", { length: 100 }).notNull(),
  accountName: varchar("account_name", { length: 100 }).notNull(),
  isVerified: boolean("is_verified").default(false),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// instructorPayouts schema
export const instructorPayouts = pgTable("instructor_payouts", {
  id: serial("id").primaryKey(),
  instructorId: varchar("instructor_id", { length: 255 }).notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  bankDetailsId: integer("bank_details_id").notNull(),
  status: varchar("status", { length: 20 }).default("pending"), // pending, processing, completed, failed
  transferCode: varchar("transfer_code", { length: 100 }),
  failureReason: text("failure_reason"),
  requestedAt: timestamp("requested_at").defaultNow(),
  processedAt: timestamp("processed_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  enrollments: many(courseEnrollments),
  lessonCompletions: many(lessonCompletions),
  quizSubmissions: many(quizSubmissions),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));