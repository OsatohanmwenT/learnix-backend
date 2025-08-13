ALTER TABLE "courses" ALTER COLUMN "category" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "small_description" text NOT NULL;