/**
 * PROGRESS MESSAGES TABLE (UC-111)
 *
 * Purpose: Support team communication tools for progress discussions
 * Created: 2025-12-01
 *
 * Features:
 * - Messages between accountability partners
 * - Messages between mentors and candidates
 * - Threaded conversations
 * - Read receipts
 */

-- ============================================================================
-- SECTION 1: PROGRESS MESSAGES TABLE
-- ============================================================================

/**
 * PROGRESS_MESSAGES
 *
 * Stores messages for progress discussions between team members,
 * accountability partners, and mentors.
 */
CREATE TABLE IF NOT EXISTS public.progress_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Optional: Link to accountability partnership (for partner messages)
  partnership_id uuid REFERENCES public.accountability_partnerships(id) ON DELETE SET NULL,

  -- Message content
  message_text text NOT NULL,
  message_type text NOT NULL DEFAULT 'message' CHECK (message_type IN (
    'message',           -- Regular message
    'encouragement',     -- Encouragement/motivation
    'progress_update',   -- Progress update notification
    'goal_reminder',     -- Goal reminder
    'celebration',       -- Celebration message
    'feedback'           -- Feedback from mentor
  )),

  -- Threading support
  parent_message_id uuid REFERENCES public.progress_messages(id) ON DELETE SET NULL,
  thread_root_id uuid REFERENCES public.progress_messages(id) ON DELETE SET NULL,

  -- Status tracking
  is_read boolean NOT NULL DEFAULT false,
  read_at timestamptz,

  -- Metadata
  metadata jsonb DEFAULT '{}'::jsonb,

  -- Soft delete
  is_deleted boolean NOT NULL DEFAULT false,

  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- Constraints
  CONSTRAINT progress_messages_different_users CHECK (sender_id != recipient_id)
);

-- Enable RLS
ALTER TABLE public.progress_messages ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_progress_messages_sender ON public.progress_messages(sender_id, created_at DESC);
CREATE INDEX idx_progress_messages_recipient ON public.progress_messages(recipient_id, created_at DESC);
CREATE INDEX idx_progress_messages_team ON public.progress_messages(team_id, created_at DESC);
CREATE INDEX idx_progress_messages_partnership ON public.progress_messages(partnership_id, created_at DESC);
CREATE INDEX idx_progress_messages_thread ON public.progress_messages(thread_root_id, created_at ASC);
CREATE INDEX idx_progress_messages_unread ON public.progress_messages(recipient_id, is_read) WHERE is_read = false;

-- Comments
COMMENT ON TABLE public.progress_messages IS 'Messages for progress discussions between team members (UC-111)';
COMMENT ON COLUMN public.progress_messages.message_type IS 'Type of message: message, encouragement, progress_update, goal_reminder, celebration, feedback';
COMMENT ON COLUMN public.progress_messages.thread_root_id IS 'ID of the first message in a thread (for threaded conversations)';

-- ============================================================================
-- SECTION 2: ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Users can view messages they sent or received
CREATE POLICY "Users can view their own messages"
  ON public.progress_messages FOR SELECT
  USING (sender_id = auth.uid() OR recipient_id = auth.uid());

-- Users can send messages to team members
CREATE POLICY "Users can send messages"
  ON public.progress_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.team_members tm1
      JOIN public.team_members tm2 ON tm1.team_id = tm2.team_id
      WHERE tm1.user_id = auth.uid()
        AND tm2.user_id = recipient_id
        AND tm1.is_active = true
        AND tm2.is_active = true
    )
  );

-- Users can update their own messages (mark as read, edit)
CREATE POLICY "Senders can update their messages"
  ON public.progress_messages FOR UPDATE
  USING (sender_id = auth.uid())
  WITH CHECK (sender_id = auth.uid());

-- Recipients can mark messages as read
CREATE POLICY "Recipients can mark messages as read"
  ON public.progress_messages FOR UPDATE
  USING (recipient_id = auth.uid())
  WITH CHECK (recipient_id = auth.uid());

-- Users can delete their own sent messages (soft delete)
CREATE POLICY "Users can delete their sent messages"
  ON public.progress_messages FOR UPDATE
  USING (sender_id = auth.uid() AND is_deleted = false)
  WITH CHECK (sender_id = auth.uid());

-- ============================================================================
-- SECTION 3: HELPER FUNCTIONS
-- ============================================================================

/**
 * Function: get_conversation
 *
 * Gets all messages between two users in a team.
 */
CREATE OR REPLACE FUNCTION get_conversation(
  p_user_id uuid,
  p_other_user_id uuid,
  p_team_id uuid,
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  sender_id uuid,
  recipient_id uuid,
  message_text text,
  message_type text,
  is_read boolean,
  created_at timestamptz,
  sender_name text,
  recipient_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pm.id,
    pm.sender_id,
    pm.recipient_id,
    pm.message_text,
    pm.message_type,
    pm.is_read,
    pm.created_at,
    sp.full_name as sender_name,
    rp.full_name as recipient_name
  FROM public.progress_messages pm
  JOIN public.profiles sp ON sp.id = pm.sender_id
  JOIN public.profiles rp ON rp.id = pm.recipient_id
  WHERE pm.team_id = p_team_id
    AND pm.is_deleted = false
    AND (
      (pm.sender_id = p_user_id AND pm.recipient_id = p_other_user_id)
      OR (pm.sender_id = p_other_user_id AND pm.recipient_id = p_user_id)
    )
  ORDER BY pm.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

COMMENT ON FUNCTION get_conversation IS 'Gets messages between two users in a team';

/**
 * Function: get_unread_message_count
 *
 * Gets count of unread messages for a user.
 */
CREATE OR REPLACE FUNCTION get_unread_message_count(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count integer;
BEGIN
  SELECT COUNT(*)::integer INTO v_count
  FROM public.progress_messages
  WHERE recipient_id = p_user_id
    AND is_read = false
    AND is_deleted = false;

  RETURN v_count;
END;
$$;

COMMENT ON FUNCTION get_unread_message_count IS 'Gets count of unread messages for a user';

/**
 * Function: get_conversations_list
 *
 * Gets list of conversations (unique chat partners) for a user.
 */
CREATE OR REPLACE FUNCTION get_conversations_list(p_user_id uuid, p_team_id uuid)
RETURNS TABLE (
  partner_id uuid,
  partner_name text,
  partner_title text,
  last_message_text text,
  last_message_at timestamptz,
  last_message_sender_id uuid,
  unread_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH conversations AS (
    SELECT
      CASE
        WHEN pm.sender_id = p_user_id THEN pm.recipient_id
        ELSE pm.sender_id
      END as partner,
      pm.message_text,
      pm.created_at,
      pm.sender_id,
      pm.is_read,
      pm.recipient_id,
      ROW_NUMBER() OVER (
        PARTITION BY
          CASE
            WHEN pm.sender_id = p_user_id THEN pm.recipient_id
            ELSE pm.sender_id
          END
        ORDER BY pm.created_at DESC
      ) as rn
    FROM public.progress_messages pm
    WHERE pm.team_id = p_team_id
      AND pm.is_deleted = false
      AND (pm.sender_id = p_user_id OR pm.recipient_id = p_user_id)
  ),
  latest_conversations AS (
    SELECT * FROM conversations WHERE rn = 1
  ),
  unread_counts AS (
    SELECT
      sender_id as partner,
      COUNT(*) as unread
    FROM public.progress_messages
    WHERE team_id = p_team_id
      AND recipient_id = p_user_id
      AND is_read = false
      AND is_deleted = false
    GROUP BY sender_id
  )
  SELECT
    lc.partner as partner_id,
    p.full_name as partner_name,
    p.professional_title as partner_title,
    lc.message_text as last_message_text,
    lc.created_at as last_message_at,
    lc.sender_id as last_message_sender_id,
    COALESCE(uc.unread, 0) as unread_count
  FROM latest_conversations lc
  JOIN public.profiles p ON p.id = lc.partner
  LEFT JOIN unread_counts uc ON uc.partner = lc.partner
  ORDER BY lc.created_at DESC;
END;
$$;

COMMENT ON FUNCTION get_conversations_list IS 'Gets list of conversation partners with last message and unread count';

-- ============================================================================
-- SECTION 4: TRIGGERS
-- ============================================================================

-- Updated_at trigger
CREATE TRIGGER update_progress_messages_updated_at
  BEFORE UPDATE ON public.progress_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SECTION 5: GRANTS
-- ============================================================================

GRANT SELECT, INSERT, UPDATE ON public.progress_messages TO authenticated;
GRANT EXECUTE ON FUNCTION get_conversation TO authenticated;
GRANT EXECUTE ON FUNCTION get_unread_message_count TO authenticated;
GRANT EXECUTE ON FUNCTION get_conversations_list TO authenticated;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Progress Messages schema migration completed successfully!';
  RAISE NOTICE 'Created:';
  RAISE NOTICE '  - progress_messages table with RLS policies';
  RAISE NOTICE '  - get_conversation() function';
  RAISE NOTICE '  - get_unread_message_count() function';
  RAISE NOTICE '  - get_conversations_list() function';
END $$;
