-- Migration: Add Custom Fields Support
-- Date: 2025-01-23
-- Description: Adds customFieldsConfig to buckets and customFields to tasks

-- Add customFieldsConfig column to buckets (safe - nullable, with default)
ALTER TABLE buckets 
ADD COLUMN IF NOT EXISTS custom_fields_config jsonb DEFAULT '[]'::jsonb;

-- Add customFields column to tasks (safe - nullable)
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS custom_fields text;

-- Add comment for documentation
COMMENT ON COLUMN buckets.custom_fields_config IS 'Array of custom field configurations: {key, label, type, options, required, order, copyOnProgress}';
COMMENT ON COLUMN tasks.custom_fields IS 'Custom field values stored as: key=value||key2=value2';