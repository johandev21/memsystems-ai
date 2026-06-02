-- Migration: Study Materials, Folders, and Trash
-- Adds: title, folder_id, deleted_at to study_materials
-- Creates: study_material_folders table
-- Adds: target_folder_id to generation_requests
-- Drops: origin_simple_flashcard_id from study_materials

-- 1. Add new columns to study_materials
ALTER TABLE "study_materials" ADD COLUMN "title" varchar(200) DEFAULT 'Untitled' NOT NULL;--> statement-breakpoint
ALTER TABLE "study_materials" ADD COLUMN "folder_id" varchar;--> statement-breakpoint
ALTER TABLE "study_materials" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint

-- 2. Backfill titles for existing rows
UPDATE "study_materials" SET "title" = 'Untitled' WHERE "title" IS NULL;--> statement-breakpoint

-- 3. Create study_material_folders table
CREATE TABLE "study_material_folders" (
	"id" varchar PRIMARY KEY NOT NULL,
	"notebook_id" varchar NOT NULL,
	"parent_id" varchar,
	"name" varchar(200) NOT NULL,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint

-- 4. Add foreign keys for study_materials.folder_id
ALTER TABLE "study_materials" ADD CONSTRAINT "study_materials_folder_id_study_material_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."study_material_folders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint

-- 5. Add foreign keys for study_material_folders
ALTER TABLE "study_material_folders" ADD CONSTRAINT "study_material_folders_notebook_id_notebooks_id_fk" FOREIGN KEY ("notebook_id") REFERENCES "public"."notebooks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_material_folders" ADD CONSTRAINT "study_material_folders_parent_id_study_material_folders_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."study_material_folders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

-- 6. Add target_folder_id to generation_requests
ALTER TABLE "generation_requests" ADD COLUMN "target_folder_id" varchar;--> statement-breakpoint
ALTER TABLE "generation_requests" ADD CONSTRAINT "generation_requests_target_folder_id_study_material_folders_id_fk" FOREIGN KEY ("target_folder_id") REFERENCES "public"."study_material_folders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint

-- 7. Drop origin_simple_flashcard_id from study_materials
ALTER TABLE "study_materials" DROP COLUMN "origin_simple_flashcard_id";--> statement-breakpoint

-- 8. Add indexes for new columns
CREATE INDEX "study_materials_title_idx" ON "study_materials" USING btree ("title");--> statement-breakpoint
CREATE INDEX "study_materials_folder_id_idx" ON "study_materials" USING btree ("folder_id");--> statement-breakpoint
CREATE INDEX "study_materials_deleted_at_idx" ON "study_materials" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "study_material_folders_notebook_id_idx" ON "study_material_folders" USING btree ("notebook_id");--> statement-breakpoint
CREATE INDEX "study_material_folders_parent_id_idx" ON "study_material_folders" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "study_material_folders_deleted_at_idx" ON "study_material_folders" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "generation_requests_target_folder_id_idx" ON "generation_requests" USING btree ("target_folder_id");
