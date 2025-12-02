-- Migration: Add metadata column to team_messages
-- Purpose: Store structured data about message types (job shares, comments, etc.)
-- Date: 2025-12-02

-- Add metadata column to team_messages table
ALTER TABLE public.team_messages
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

-- Create index for querying by metadata type
CREATE INDEX IF NOT EXISTS idx_team_messages_metadata_type
ON public.team_messages USING gin(metadata);

-- Comment on the new column
COMMENT ON COLUMN public.team_messages.metadata IS 'Structured metadata for message types (job_share, job_comment, etc.)';
