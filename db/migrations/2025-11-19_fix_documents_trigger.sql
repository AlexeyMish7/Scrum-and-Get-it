-- Fix: Remove incorrect updated_at trigger from documents table
-- The documents table uses last_edited_at (manually updated via triggers)
-- instead of updated_at (auto-updated), so this trigger causes errors

DROP TRIGGER IF EXISTS documents_updated_at ON public.documents;

-- Note: documents.last_edited_at is updated by the update_document_last_edited()
-- trigger when a new document_version is created, not by a generic updated_at trigger
