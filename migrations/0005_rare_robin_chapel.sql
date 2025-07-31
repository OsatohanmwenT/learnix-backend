CREATE TABLE "ai_generation_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_type" varchar(50) NOT NULL,
	"prompt" text NOT NULL,
	"response" text NOT NULL,
	"model" varchar(100) NOT NULL,
	"tokens_used" integer,
	"cost_cents" integer,
	"quality_score" integer,
	"content_id" uuid,
	"user_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quiz_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"quiz_id" uuid NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"current_difficulty" integer DEFAULT 50 NOT NULL,
	"mastery_score" integer DEFAULT 0 NOT NULL,
	"questions_asked" integer DEFAULT 0 NOT NULL,
	"correct_answers" integer DEFAULT 0 NOT NULL,
	"is_completed" boolean DEFAULT false NOT NULL,
	"adaptive_algorithm" varchar(50) DEFAULT 'irt' NOT NULL,
	"session_data" jsonb
);
--> statement-breakpoint
ALTER TABLE "quiz_submissions" RENAME COLUMN "total_questions" TO "started_at";--> statement-breakpoint
ALTER TABLE "quiz_submissions" ALTER COLUMN "submitted_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "quiz_submissions" ALTER COLUMN "submitted_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "quiz_submissions" ALTER COLUMN "score" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "quiz_submissions" ALTER COLUMN "attempt_number" SET DEFAULT 1;--> statement-breakpoint
ALTER TABLE "answer_options" ADD COLUMN "order_index" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "question_responses" ADD COLUMN "points_earned" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "question_responses" ADD COLUMN "time_spent_seconds" integer;--> statement-breakpoint
ALTER TABLE "question_responses" ADD COLUMN "hints_used" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "question_responses" ADD COLUMN "confidence_level" integer;--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "points" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "order_index" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "topic" varchar(100);--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "hints" jsonb;--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "estimated_time_seconds" integer;--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "quiz_submissions" ADD COLUMN "max_score" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "quiz_submissions" ADD COLUMN "time_spent_minutes" integer;--> statement-breakpoint
ALTER TABLE "quiz_submissions" ADD COLUMN "is_passed" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "quiz_submissions" ADD COLUMN "adaptive_data" jsonb;--> statement-breakpoint
ALTER TABLE "quizzes" ADD COLUMN "time_limit_minutes" integer;--> statement-breakpoint
ALTER TABLE "quizzes" ADD COLUMN "passing_score" integer DEFAULT 70 NOT NULL;--> statement-breakpoint
ALTER TABLE "quizzes" ADD COLUMN "is_adaptive" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "quizzes" ADD COLUMN "mastery_threshold" integer DEFAULT 80 NOT NULL;--> statement-breakpoint
ALTER TABLE "quizzes" ADD COLUMN "randomize_questions" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "quizzes" ADD COLUMN "show_correct_answers" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "ai_generation_logs" ADD CONSTRAINT "ai_generation_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_sessions" ADD CONSTRAINT "quiz_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_sessions" ADD CONSTRAINT "quiz_sessions_quiz_id_quizzes_id_fk" FOREIGN KEY ("quiz_id") REFERENCES "public"."quizzes"("id") ON DELETE cascade ON UPDATE no action;