ALTER TABLE "notifications"
  ADD COLUMN IF NOT EXISTS "message" text,
  ADD COLUMN IF NOT EXISTS "seen" boolean DEFAULT false;
