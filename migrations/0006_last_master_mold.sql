ALTER TABLE "ai_generation_logs" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "quiz_sessions" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "ai_generation_logs" CASCADE;--> statement-breakpoint
DROP TABLE "quiz_sessions" CASCADE;--> statement-breakpoint
ALTER TABLE "quiz_submissions" ALTER COLUMN "percentage_score" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "quizzes" ALTER COLUMN "max_attempts" SET DEFAULT 3;--> statement-breakpoint
ALTER TABLE "question_responses" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "quiz_submissions" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
CREATE INDEX "answer_options_question_id_idx" ON "answer_options" USING btree ("question_id");--> statement-breakpoint
CREATE INDEX "question_responses_submission_id_idx" ON "question_responses" USING btree ("submission_id");--> statement-breakpoint
CREATE INDEX "question_responses_question_id_idx" ON "question_responses" USING btree ("question_id");--> statement-breakpoint
CREATE INDEX "questions_quiz_id_idx" ON "questions" USING btree ("quiz_id");--> statement-breakpoint
CREATE INDEX "questions_order_idx" ON "questions" USING btree ("quiz_id","order_index");--> statement-breakpoint
CREATE INDEX "quiz_submissions_user_id_idx" ON "quiz_submissions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "quiz_submissions_quiz_id_idx" ON "quiz_submissions" USING btree ("quiz_id");--> statement-breakpoint
CREATE INDEX "quiz_submissions_submitted_at_idx" ON "quiz_submissions" USING btree ("submitted_at");--> statement-breakpoint
CREATE INDEX "quizzes_lesson_id_idx" ON "quizzes" USING btree ("lesson_id");--> statement-breakpoint
CREATE INDEX "quizzes_difficulty_idx" ON "quizzes" USING btree ("difficulty");--> statement-breakpoint
ALTER TABLE "question_responses" DROP COLUMN "time_spent_seconds";--> statement-breakpoint
ALTER TABLE "question_responses" DROP COLUMN "hints_used";--> statement-breakpoint
ALTER TABLE "question_responses" DROP COLUMN "confidence_level";--> statement-breakpoint
ALTER TABLE "question_responses" DROP COLUMN "graded_at";--> statement-breakpoint
ALTER TABLE "question_responses" DROP COLUMN "ai_grading_confidence";--> statement-breakpoint
ALTER TABLE "question_responses" DROP COLUMN "ai_grading_details";--> statement-breakpoint
ALTER TABLE "questions" DROP COLUMN "difficulty";--> statement-breakpoint
ALTER TABLE "questions" DROP COLUMN "ai_prompt_used";--> statement-breakpoint
ALTER TABLE "questions" DROP COLUMN "topic";--> statement-breakpoint
ALTER TABLE "questions" DROP COLUMN "hints";--> statement-breakpoint
ALTER TABLE "questions" DROP COLUMN "estimated_time_seconds";--> statement-breakpoint
ALTER TABLE "quiz_submissions" DROP COLUMN "max_score";--> statement-breakpoint
ALTER TABLE "quiz_submissions" DROP COLUMN "time_spent_minutes";--> statement-breakpoint
ALTER TABLE "quiz_submissions" DROP COLUMN "adaptive_path_taken";--> statement-breakpoint
ALTER TABLE "quiz_submissions" DROP COLUMN "adaptive_data";--> statement-breakpoint
ALTER TABLE "quizzes" DROP COLUMN "generated_by_ai";--> statement-breakpoint
ALTER TABLE "quizzes" DROP COLUMN "is_adaptive";--> statement-breakpoint
ALTER TABLE "quizzes" DROP COLUMN "mastery_threshold";