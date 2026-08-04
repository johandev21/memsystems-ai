ALTER TABLE "user_settings" ADD COLUMN IF NOT EXISTS "deepseek_api_key" text;--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN IF NOT EXISTS "anthropic_api_key" text;--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN IF NOT EXISTS "gemini_api_key" text;--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN IF NOT EXISTS "kimi_api_key" text;
