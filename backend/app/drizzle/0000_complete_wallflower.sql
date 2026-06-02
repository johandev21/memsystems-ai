CREATE TYPE "public"."card_state" AS ENUM('new', 'learning', 'review');--> statement-breakpoint
CREATE TYPE "public"."chat_role" AS ENUM('user', 'assistant');--> statement-breakpoint
CREATE TYPE "public"."generation_status" AS ENUM('streaming', 'completed', 'failed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."provider" AS ENUM('openai', 'anthropic', 'google', 'deepseek', 'minimax', 'qwen');--> statement-breakpoint
CREATE TYPE "public"."source_kind" AS ENUM('text', 'url', 'file');--> statement-breakpoint
CREATE TYPE "public"."study_material_kind" AS ENUM('quiz', 'simple_flashcard', 'report', 'roadmap', 'slide_deck', 'mind_map');--> statement-breakpoint
CREATE TABLE "cards" (
	"id" varchar PRIMARY KEY NOT NULL,
	"note_id" varchar NOT NULL,
	"template_index" integer NOT NULL,
	"state" "card_state" DEFAULT 'new' NOT NULL,
	"suspended" boolean DEFAULT false NOT NULL,
	"easiness_factor" real DEFAULT 2.5 NOT NULL,
	"interval_days" real DEFAULT 0 NOT NULL,
	"repetitions" integer DEFAULT 0 NOT NULL,
	"due_at" timestamp DEFAULT now() NOT NULL,
	"last_reviewed_at" timestamp,
	"last_quality" integer,
	"lapses" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "generation_requests" (
	"id" varchar PRIMARY KEY NOT NULL,
	"notebook_id" varchar NOT NULL,
	"kind" "study_material_kind" NOT NULL,
	"brief" text DEFAULT '' NOT NULL,
	"source_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" "generation_status" DEFAULT 'streaming' NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "note_tags" (
	"note_id" varchar NOT NULL,
	"tag_id" varchar NOT NULL,
	CONSTRAINT "note_tags_note_id_tag_id_pk" PRIMARY KEY("note_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "note_types" (
	"id" varchar PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" varchar(100) NOT NULL,
	"fields_schema" jsonb NOT NULL,
	"card_templates" jsonb NOT NULL,
	"is_built_in" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notebook_chat_messages" (
	"id" varchar PRIMARY KEY NOT NULL,
	"notebook_id" varchar NOT NULL,
	"role" "chat_role" NOT NULL,
	"content" text NOT NULL,
	"cited_source_ids" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notebooks" (
	"id" varchar PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"title" varchar(200) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notes" (
	"id" varchar PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"note_type_id" varchar NOT NULL,
	"field_values" jsonb NOT NULL,
	"origin_simple_flashcard_id" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "provider_keys" (
	"id" varchar PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"provider" "provider" NOT NULL,
	"encrypted_key" text NOT NULL,
	"iv" text NOT NULL,
	"auth_tag" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_used_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "sources" (
	"id" varchar PRIMARY KEY NOT NULL,
	"notebook_id" varchar NOT NULL,
	"kind" "source_kind" NOT NULL,
	"title" varchar(500) NOT NULL,
	"raw_text" text NOT NULL,
	"url" text,
	"s3_key" varchar(1000),
	"content_type" varchar(200),
	"file_size" integer,
	"sha256" varchar(64),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "study_materials" (
	"id" varchar PRIMARY KEY NOT NULL,
	"notebook_id" varchar NOT NULL,
	"kind" "study_material_kind" NOT NULL,
	"content" jsonb NOT NULL,
	"origin_simple_flashcard_id" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" varchar PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" varchar(50) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cards" ADD CONSTRAINT "cards_note_id_notes_id_fk" FOREIGN KEY ("note_id") REFERENCES "public"."notes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generation_requests" ADD CONSTRAINT "generation_requests_notebook_id_notebooks_id_fk" FOREIGN KEY ("notebook_id") REFERENCES "public"."notebooks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "note_tags" ADD CONSTRAINT "note_tags_note_id_notes_id_fk" FOREIGN KEY ("note_id") REFERENCES "public"."notes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "note_tags" ADD CONSTRAINT "note_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "note_types" ADD CONSTRAINT "note_types_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notebook_chat_messages" ADD CONSTRAINT "notebook_chat_messages_notebook_id_notebooks_id_fk" FOREIGN KEY ("notebook_id") REFERENCES "public"."notebooks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notebooks" ADD CONSTRAINT "notebooks_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_note_type_id_note_types_id_fk" FOREIGN KEY ("note_type_id") REFERENCES "public"."note_types"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_keys" ADD CONSTRAINT "provider_keys_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sources" ADD CONSTRAINT "sources_notebook_id_notebooks_id_fk" FOREIGN KEY ("notebook_id") REFERENCES "public"."notebooks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_materials" ADD CONSTRAINT "study_materials_notebook_id_notebooks_id_fk" FOREIGN KEY ("notebook_id") REFERENCES "public"."notebooks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tags" ADD CONSTRAINT "tags_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "cards_note_id_idx" ON "cards" USING btree ("note_id");--> statement-breakpoint
CREATE INDEX "cards_due_at_idx" ON "cards" USING btree ("due_at");--> statement-breakpoint
CREATE INDEX "cards_state_idx" ON "cards" USING btree ("state");--> statement-breakpoint
CREATE INDEX "generation_requests_notebook_id_idx" ON "generation_requests" USING btree ("notebook_id");--> statement-breakpoint
CREATE INDEX "note_tags_tag_id_idx" ON "note_tags" USING btree ("tag_id");--> statement-breakpoint
CREATE INDEX "note_types_user_id_idx" ON "note_types" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "note_types_user_name_uq" ON "note_types" USING btree ("user_id","name");--> statement-breakpoint
CREATE INDEX "notebook_chat_messages_notebook_id_idx" ON "notebook_chat_messages" USING btree ("notebook_id");--> statement-breakpoint
CREATE INDEX "notebook_chat_messages_created_at_idx" ON "notebook_chat_messages" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "notebooks_user_id_idx" ON "notebooks" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notes_user_id_idx" ON "notes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notes_note_type_id_idx" ON "notes" USING btree ("note_type_id");--> statement-breakpoint
CREATE INDEX "provider_keys_user_id_idx" ON "provider_keys" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "provider_keys_user_provider_uq" ON "provider_keys" USING btree ("user_id","provider");--> statement-breakpoint
CREATE INDEX "sources_notebook_id_idx" ON "sources" USING btree ("notebook_id");--> statement-breakpoint
CREATE INDEX "sources_kind_idx" ON "sources" USING btree ("kind");--> statement-breakpoint
CREATE INDEX "study_materials_notebook_id_idx" ON "study_materials" USING btree ("notebook_id");--> statement-breakpoint
CREATE INDEX "study_materials_kind_idx" ON "study_materials" USING btree ("kind");--> statement-breakpoint
CREATE INDEX "tags_user_id_idx" ON "tags" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tags_user_name_uq" ON "tags" USING btree ("user_id","name");