-- Migration: Add Deleted Projects/Tasks Archive Tables
-- Date: 2026-01-28
-- Description: Adds deleted_projects and deleted_tasks tables for archive/undo support

CREATE TABLE IF NOT EXISTS deleted_projects (
  id integer PRIMARY KEY,
  name text NOT NULL,
  description text,
  status text,
  start_date timestamp,
  end_date timestamp,
  owner_id integer,
  last_modified_by integer,
  buckets jsonb DEFAULT '[]'::jsonb,
  deleted_at timestamp DEFAULT now(),
  deleted_by integer,
  deleted_by_name text
);

CREATE TABLE IF NOT EXISTS deleted_tasks (
  id integer PRIMARY KEY,
  title text NOT NULL,
  description text,
  status text,
  priority text,
  project_id integer,
  bucket_id integer,
  assignee_id integer,
  assigned_users integer[],
  estimate_hours integer,
  estimate_minutes integer,
  history jsonb,
  checklist jsonb,
  attachments jsonb,
  start_date timestamp,
  due_date timestamp,
  position integer,
  created_at timestamp,
  custom_fields text,
  deleted_by_project boolean DEFAULT false,
  deleted_at timestamp DEFAULT now(),
  deleted_by integer,
  deleted_by_name text
);

COMMENT ON TABLE deleted_projects IS 'Archived projects for soft-delete/undo support';
COMMENT ON TABLE deleted_tasks IS 'Archived tasks for soft-delete/undo support';
