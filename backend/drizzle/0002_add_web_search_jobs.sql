DO $$ BEGIN
  CREATE TYPE "web_search_job_status" AS ENUM('pending', 'processing', 'ready', 'failed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "web_search_jobs" (
	"id" varchar PRIMARY KEY,
	"notebook_id" varchar NOT NULL,
	"user_id" text NOT NULL,
	"query" varchar(500) NOT NULL,
	"model_id" varchar(200) NOT NULL,
	"status" "web_search_job_status" DEFAULT 'pending' NOT NULL,
	"summary" text,
	"candidates" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"last_error" text,
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "web_search_jobs_notebook_id_notebooks_id_fk" FOREIGN KEY ("notebook_id") REFERENCES "notebooks"("id") ON DELETE CASCADE,
	CONSTRAINT "web_search_jobs_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "web_search_jobs_notebook_id_idx" ON "web_search_jobs" ("notebook_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "web_search_jobs_status_idx" ON "web_search_jobs" ("status");
