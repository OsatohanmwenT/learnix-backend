CREATE TABLE "instructor_bank_details" (
	"id" serial PRIMARY KEY NOT NULL,
	"instructor_id" varchar(255) NOT NULL,
	"account_number" varchar(20) NOT NULL,
	"bank_code" varchar(10) NOT NULL,
	"bank_name" varchar(100) NOT NULL,
	"account_name" varchar(100) NOT NULL,
	"is_verified" boolean DEFAULT false,
	"is_default" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "instructor_payouts" (
	"id" serial PRIMARY KEY NOT NULL,
	"instructor_id" varchar(255) NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"bank_details_id" integer NOT NULL,
	"status" varchar(20) DEFAULT 'pending',
	"transfer_code" varchar(100),
	"failure_reason" text,
	"requested_at" timestamp DEFAULT now(),
	"processed_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
