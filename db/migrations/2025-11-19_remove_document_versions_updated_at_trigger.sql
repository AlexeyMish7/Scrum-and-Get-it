-- Remove any incorrectly applied updated_at trigger on document_versions
-- document_versions table doesn't have an updated_at column (it's immutable)
-- so any trigger trying to set it will fail

DROP TRIGGER IF EXISTS document_versions_updated_at ON public.document_versions;

-- Verify no triggers reference update_updated_at_column for document_versions
-- (This is a safety check - the DROP IF EXISTS above should handle it)
