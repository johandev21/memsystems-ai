-- Migration: Add description, banner, and icon to notebooks

ALTER TABLE "notebooks" ADD COLUMN "description" varchar(500) DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "notebooks" ADD COLUMN "icon" varchar(50) DEFAULT 'notebook' NOT NULL;--> statement-breakpoint
ALTER TABLE "notebooks" ADD COLUMN "banner" varchar(2000);
