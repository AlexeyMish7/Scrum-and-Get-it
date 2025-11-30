-- ============================================================================
-- UC-110: Collaborative Resume and Cover Letter Review
-- Migration: Document Reviews Schema
--
-- Purpose:
-- - Enable users to share documents with reviewers for feedback
-- - Support comments, suggestions, and approval workflows
-- - Track review deadlines and feedback implementation
-- - Integrate with team management for mentor/peer reviews
--
-- Tables Created:
-- 1. document_reviews - Links documents to reviewers with permissions
-- 2. review_comments - Threaded comments and suggestions on documents
--
-- Security:
-- - RLS policies ensure users only see reviews they own or are assigned to
-- - Team-based access for mentor reviews
-- ============================================================================

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

-- Review status tracking
CREATE TYPE review_status_enum AS ENUM (
  'pending',        -- Waiting for reviewer to start
  'in_progress',    -- Reviewer has started reviewing
  'completed',      -- Review finished (approved or with feedback)
  'expired',        -- Deadline passed without completion
  'cancelled'       -- Owner cancelled the review request
);

-- Type of review being requested
CREATE TYPE review_type_enum AS ENUM (
  'feedback',       -- General feedback request
  'approval',       -- Formal approval required
  'peer_review',    -- Peer-to-peer review
  'mentor_review'   -- Mentor reviewing mentee's work
);

-- Access level for reviewers
CREATE TYPE review_access_enum AS ENUM (
  'view',           -- Can only view the document
  'comment',        -- Can view and add comments
  'suggest',        -- Can view, comment, and make suggestions
  'approve'         -- Full access including approval authority
);

-- Comment types for categorization
CREATE TYPE comment_type_enum AS ENUM (
  'comment',        -- General comment
  'suggestion',     -- Suggested change
  'praise',         -- Positive feedback
  'change_request', -- Required change before approval
  'question',       -- Question for clarification
  'approval',       -- Approval note
  'rejection'       -- Rejection with reason
);

-- ============================================================================
-- TABLE: document_reviews
-- Links documents to reviewers with access control and deadlines
-- ============================================================================

CREATE TABLE public.document_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Document being reviewed
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  version_id UUID REFERENCES public.document_versions(id) ON DELETE SET NULL,

  -- Participants
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Optional team context (for team-based reviews)
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,

  -- Review configuration
  review_type review_type_enum NOT NULL DEFAULT 'feedback',
  access_level review_access_enum NOT NULL DEFAULT 'comment',
  status review_status_enum NOT NULL DEFAULT 'pending',

  -- Deadlines and timing
  due_date TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Approval tracking
  is_approved BOOLEAN DEFAULT NULL,  -- NULL = not yet decided, TRUE = approved, FALSE = rejected
  approval_note TEXT,

  -- Communication
  request_message TEXT,              -- Message from owner when requesting review
  reviewer_notes TEXT,               -- Private notes from reviewer

  -- Statistics (denormalized for performance)
  total_comments INTEGER NOT NULL DEFAULT 0,
  unresolved_comments INTEGER NOT NULL DEFAULT 0,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Constraints
  CONSTRAINT different_owner_reviewer CHECK (owner_id != reviewer_id),
  CONSTRAINT valid_completion CHECK (
    (status != 'completed') OR (completed_at IS NOT NULL)
  )
);

-- Indexes for common queries
CREATE INDEX idx_document_reviews_document ON document_reviews(document_id);
CREATE INDEX idx_document_reviews_owner ON document_reviews(owner_id);
CREATE INDEX idx_document_reviews_reviewer ON document_reviews(reviewer_id);
CREATE INDEX idx_document_reviews_team ON document_reviews(team_id) WHERE team_id IS NOT NULL;
CREATE INDEX idx_document_reviews_status ON document_reviews(status);
CREATE INDEX idx_document_reviews_due_date ON document_reviews(due_date) WHERE due_date IS NOT NULL;

-- Composite index for reviewer's pending reviews
CREATE INDEX idx_document_reviews_reviewer_pending
  ON document_reviews(reviewer_id, status)
  WHERE status IN ('pending', 'in_progress');

-- ============================================================================
-- TABLE: review_comments
-- Threaded comments and suggestions on documents
-- ============================================================================

CREATE TABLE public.review_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Parent review
  review_id UUID NOT NULL REFERENCES public.document_reviews(id) ON DELETE CASCADE,

  -- Comment author
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Threading (for replies)
  parent_comment_id UUID REFERENCES public.review_comments(id) ON DELETE CASCADE,

  -- Comment content
  comment_text TEXT NOT NULL,
  comment_type comment_type_enum NOT NULL DEFAULT 'comment',

  -- Document location (for inline comments)
  section_path TEXT,                 -- e.g., "experience.0.bullets.2"
  selection_range JSONB,             -- { start: number, end: number } for text selection

  -- Resolution tracking
  is_resolved BOOLEAN NOT NULL DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  resolution_note TEXT,

  -- Edit tracking
  is_edited BOOLEAN NOT NULL DEFAULT FALSE,
  edited_at TIMESTAMPTZ,
  original_text TEXT,                -- Preserved if edited

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX idx_review_comments_review ON review_comments(review_id);
CREATE INDEX idx_review_comments_user ON review_comments(user_id);
CREATE INDEX idx_review_comments_parent ON review_comments(parent_comment_id) WHERE parent_comment_id IS NOT NULL;
CREATE INDEX idx_review_comments_unresolved ON review_comments(review_id, is_resolved) WHERE is_resolved = FALSE;
CREATE INDEX idx_review_comments_section ON review_comments(review_id, section_path) WHERE section_path IS NOT NULL;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp for document_reviews
CREATE TRIGGER update_document_reviews_updated_at
  BEFORE UPDATE ON document_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-update updated_at timestamp for review_comments
CREATE TRIGGER update_review_comments_updated_at
  BEFORE UPDATE ON review_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update comment counts when comments are added/removed/resolved
CREATE OR REPLACE FUNCTION update_review_comment_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE document_reviews
    SET
      total_comments = total_comments + 1,
      unresolved_comments = CASE WHEN NEW.is_resolved THEN unresolved_comments ELSE unresolved_comments + 1 END
    WHERE id = NEW.review_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE document_reviews
    SET
      total_comments = GREATEST(0, total_comments - 1),
      unresolved_comments = CASE WHEN OLD.is_resolved THEN unresolved_comments ELSE GREATEST(0, unresolved_comments - 1) END
    WHERE id = OLD.review_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.is_resolved != NEW.is_resolved THEN
    UPDATE document_reviews
    SET unresolved_comments = CASE
      WHEN NEW.is_resolved THEN GREATEST(0, unresolved_comments - 1)
      ELSE unresolved_comments + 1
    END
    WHERE id = NEW.review_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_review_comment_counts
  AFTER INSERT OR UPDATE OR DELETE ON review_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_review_comment_counts();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE document_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_comments ENABLE ROW LEVEL SECURITY;

-- Document Reviews Policies

-- Owners can see all reviews for their documents
CREATE POLICY "Owners can view their document reviews"
  ON document_reviews FOR SELECT
  USING (auth.uid() = owner_id);

-- Reviewers can see reviews assigned to them
CREATE POLICY "Reviewers can view assigned reviews"
  ON document_reviews FOR SELECT
  USING (auth.uid() = reviewer_id);

-- Team members can see team reviews (if they're mentor/admin)
CREATE POLICY "Team mentors can view team reviews"
  ON document_reviews FOR SELECT
  USING (
    team_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.team_id = document_reviews.team_id
        AND tm.user_id = auth.uid()
        AND tm.role IN ('admin', 'mentor')
        AND tm.is_active = TRUE
    )
  );

-- Owners can create reviews for their documents
CREATE POLICY "Owners can create reviews"
  ON document_reviews FOR INSERT
  WITH CHECK (
    auth.uid() = owner_id AND
    EXISTS (
      SELECT 1 FROM documents d
      WHERE d.id = document_id AND d.user_id = auth.uid()
    )
  );

-- Owners can update their reviews (cancel, change deadline)
CREATE POLICY "Owners can update their reviews"
  ON document_reviews FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Reviewers can update their assigned reviews (status, approval, notes)
CREATE POLICY "Reviewers can update assigned reviews"
  ON document_reviews FOR UPDATE
  USING (auth.uid() = reviewer_id)
  WITH CHECK (auth.uid() = reviewer_id);

-- Owners can delete their review requests
CREATE POLICY "Owners can delete their reviews"
  ON document_reviews FOR DELETE
  USING (auth.uid() = owner_id);

-- Review Comments Policies

-- Users can view comments on reviews they're part of
CREATE POLICY "Users can view comments on their reviews"
  ON review_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM document_reviews dr
      WHERE dr.id = review_id
        AND (dr.owner_id = auth.uid() OR dr.reviewer_id = auth.uid())
    )
  );

-- Users can add comments if they have comment access
CREATE POLICY "Users can add comments to accessible reviews"
  ON review_comments FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM document_reviews dr
      WHERE dr.id = review_id
        AND (
          dr.owner_id = auth.uid() OR
          (dr.reviewer_id = auth.uid() AND dr.access_level IN ('comment', 'suggest', 'approve'))
        )
    )
  );

-- Users can update their own comments
CREATE POLICY "Users can update their own comments"
  ON review_comments FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Document owners and comment authors can resolve comments
CREATE POLICY "Owners and authors can resolve comments"
  ON review_comments FOR UPDATE
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM document_reviews dr
      WHERE dr.id = review_id AND dr.owner_id = auth.uid()
    )
  );

-- Users can delete their own comments
CREATE POLICY "Users can delete their own comments"
  ON review_comments FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Get review summary for a document
CREATE OR REPLACE FUNCTION get_document_review_summary(p_document_id UUID)
RETURNS TABLE (
  total_reviews BIGINT,
  pending_reviews BIGINT,
  completed_reviews BIGINT,
  approved_reviews BIGINT,
  total_comments BIGINT,
  unresolved_comments BIGINT,
  overdue_reviews BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_reviews,
    COUNT(*) FILTER (WHERE status = 'pending')::BIGINT as pending_reviews,
    COUNT(*) FILTER (WHERE status = 'completed')::BIGINT as completed_reviews,
    COUNT(*) FILTER (WHERE is_approved = TRUE)::BIGINT as approved_reviews,
    COALESCE(SUM(dr.total_comments), 0)::BIGINT as total_comments,
    COALESCE(SUM(dr.unresolved_comments), 0)::BIGINT as unresolved_comments,
    COUNT(*) FILTER (WHERE status IN ('pending', 'in_progress') AND due_date < NOW())::BIGINT as overdue_reviews
  FROM document_reviews dr
  WHERE dr.document_id = p_document_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get feedback themes summary (aggregates comment types and patterns)
CREATE OR REPLACE FUNCTION get_review_feedback_summary(p_review_id UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_comments', COUNT(*),
    'resolved_count', COUNT(*) FILTER (WHERE is_resolved = TRUE),
    'unresolved_count', COUNT(*) FILTER (WHERE is_resolved = FALSE),
    'by_type', jsonb_object_agg(
      comment_type::text,
      type_count
    ),
    'by_section', jsonb_object_agg(
      COALESCE(section_path, 'general'),
      section_count
    )
  ) INTO result
  FROM (
    SELECT
      comment_type,
      COUNT(*) as type_count,
      section_path,
      COUNT(*) OVER (PARTITION BY section_path) as section_count,
      is_resolved
    FROM review_comments
    WHERE review_id = p_review_id
    GROUP BY comment_type, section_path, is_resolved
  ) subq;

  RETURN COALESCE(result, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- GRANTS
-- ============================================================================

-- Grant access to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON document_reviews TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON review_comments TO authenticated;

-- Grant execute on helper functions
GRANT EXECUTE ON FUNCTION get_document_review_summary TO authenticated;
GRANT EXECUTE ON FUNCTION get_review_feedback_summary TO authenticated;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE document_reviews IS 'Tracks document review requests between users';
COMMENT ON TABLE review_comments IS 'Threaded comments and suggestions on document reviews';
COMMENT ON FUNCTION get_document_review_summary IS 'Returns aggregate review statistics for a document';
COMMENT ON FUNCTION get_review_feedback_summary IS 'Returns feedback theme analysis for a review';
