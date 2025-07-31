CREATE TYPE "public"."mastery_level" AS ENUM('novice', 'developing', 'proficient', 'advanced', 'expert');--> statement-breakpoint
CREATE TYPE "public"."question_type" AS ENUM('multiple_choice', 'true_false', 'short_answer', 'long_answer', 'fill_in_the_blank');--> statement-breakpoint
CREATE TYPE "public"."recommendation_type" AS ENUM('content', 'quiz', 'remediation', 'next_module');--> statement-breakpoint
CREATE TYPE "public"."skill_proficiency" AS ENUM('novice', 'beginner', 'intermediate', 'proficient', 'expert', 'mastered');--> statement-breakpoint
CREATE TABLE "adaptive_recommendations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"topic_id" uuid,
	"recommendation_type" "recommendation_type" NOT NULL,
	"recommended_content_id" uuid,
	"message" text,
	"is_dismissed" boolean DEFAULT false NOT NULL,
	"is_actioned" boolean DEFAULT false NOT NULL,
	"generated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_topic_tags" (
	"lesson_id" uuid NOT NULL,
	"topic_id" uuid NOT NULL,
	CONSTRAINT "content_topic_tags_lesson_id_topic_id_pk" PRIMARY KEY("lesson_id","topic_id")
);
--> statement-breakpoint
CREATE TABLE "learning_analytics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"course_id" uuid,
	"session_id" uuid,
	"activity_type" varchar(50) NOT NULL,
	"content_id" uuid,
	"time_spent_seconds" integer NOT NULL,
	"interaction_data" jsonb,
	"performance_score" numeric(5, 2),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "learning_topics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"parent_topic_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "learning_topics_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "mastery_levels" (
	"user_id" uuid NOT NULL,
	"topic_id" uuid NOT NULL,
	"score" numeric(5, 4) DEFAULT '0.0' NOT NULL,
	"proficiency_level" "skill_proficiency" DEFAULT 'novice' NOT NULL,
	"last_updated" timestamp DEFAULT now() NOT NULL,
	"model_confidence" integer,
	"model_version" varchar(50),
	CONSTRAINT "mastery_levels_user_id_topic_id_pk" PRIMARY KEY("user_id","topic_id")
);
--> statement-breakpoint
CREATE TABLE "question_topic_tags" (
	"question_id" uuid NOT NULL,
	"topic_id" uuid NOT NULL,
	CONSTRAINT "question_topic_tags_question_id_topic_id_pk" PRIMARY KEY("question_id","topic_id")
);
--> statement-breakpoint
CREATE TABLE "answer_options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question_id" uuid NOT NULL,
	"text" text NOT NULL,
	"is_correct" boolean NOT NULL,
	"explanation" text
);
--> statement-breakpoint
CREATE TABLE "question_responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submission_id" uuid NOT NULL,
	"question_id" uuid NOT NULL,
	"submitted_answer" text,
	"selected_option_id" uuid,
	"is_correct" boolean NOT NULL,
	"graded_at" timestamp DEFAULT now(),
	"ai_grading_confidence" integer,
	"ai_grading_details" jsonb
);
--> statement-breakpoint
CREATE TABLE "questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quiz_id" uuid NOT NULL,
	"text" text NOT NULL,
	"question_type" "question_type" NOT NULL,
	"difficulty" "difficulty" DEFAULT 'intermediate' NOT NULL,
	"correct_answer" text,
	"feedback" text,
	"ai_prompt_used" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "quiz_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"quiz_id" uuid NOT NULL,
	"submitted_at" timestamp DEFAULT now() NOT NULL,
	"score" integer NOT NULL,
	"total_questions" integer NOT NULL,
	"percentage_score" integer NOT NULL,
	"attempt_number" integer NOT NULL,
	"is_completed" boolean DEFAULT false NOT NULL,
	"adaptive_path_taken" jsonb
);
--> statement-breakpoint
CREATE TABLE "quizzes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"lesson_id" uuid,
	"generated_by_ai" boolean DEFAULT false NOT NULL,
	"difficulty" "difficulty" DEFAULT 'intermediate' NOT NULL,
	"max_attempts" integer DEFAULT 1,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "adaptive_recommendations" ADD CONSTRAINT "adaptive_recommendations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "adaptive_recommendations" ADD CONSTRAINT "adaptive_recommendations_topic_id_learning_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."learning_topics"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_topic_tags" ADD CONSTRAINT "content_topic_tags_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_topic_tags" ADD CONSTRAINT "content_topic_tags_topic_id_learning_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."learning_topics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_analytics" ADD CONSTRAINT "learning_analytics_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_analytics" ADD CONSTRAINT "learning_analytics_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mastery_levels" ADD CONSTRAINT "mastery_levels_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mastery_levels" ADD CONSTRAINT "mastery_levels_topic_id_learning_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."learning_topics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_topic_tags" ADD CONSTRAINT "question_topic_tags_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_topic_tags" ADD CONSTRAINT "question_topic_tags_topic_id_learning_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."learning_topics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "answer_options" ADD CONSTRAINT "answer_options_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_responses" ADD CONSTRAINT "question_responses_submission_id_quiz_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."quiz_submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_responses" ADD CONSTRAINT "question_responses_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_responses" ADD CONSTRAINT "question_responses_selected_option_id_answer_options_id_fk" FOREIGN KEY ("selected_option_id") REFERENCES "public"."answer_options"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_quiz_id_quizzes_id_fk" FOREIGN KEY ("quiz_id") REFERENCES "public"."quizzes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_submissions" ADD CONSTRAINT "quiz_submissions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_submissions" ADD CONSTRAINT "quiz_submissions_quiz_id_quizzes_id_fk" FOREIGN KEY ("quiz_id") REFERENCES "public"."quizzes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "analytics_user_idx" ON "learning_analytics" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "analytics_course_idx" ON "learning_analytics" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "analytics_activity_idx" ON "learning_analytics" USING btree ("activity_type");--> statement-breakpoint
CREATE INDEX "analytics_created_at_idx" ON "learning_analytics" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "parent_topic_idx" ON "learning_topics" USING btree ("parent_topic_id");