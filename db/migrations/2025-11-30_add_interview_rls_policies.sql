-- Add RLS policies for interview analytics tables

-- Interviews table
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "interviews_select_own" ON public.interviews;
CREATE POLICY "interviews_select_own"
  ON public.interviews FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "interviews_insert_own" ON public.interviews;
CREATE POLICY "interviews_insert_own"
  ON public.interviews FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "interviews_update_own" ON public.interviews;
CREATE POLICY "interviews_update_own"
  ON public.interviews FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "interviews_delete_own" ON public.interviews;
CREATE POLICY "interviews_delete_own"
  ON public.interviews FOR DELETE
  USING (user_id = auth.uid());

-- Interview Feedback table
ALTER TABLE public.interview_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "feedback_select_via_interview" ON public.interview_feedback;
CREATE POLICY "feedback_select_via_interview"
  ON public.interview_feedback FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.interviews
      WHERE interviews.id = interview_feedback.interview_id
        AND interviews.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "feedback_insert_via_interview" ON public.interview_feedback;
CREATE POLICY "feedback_insert_via_interview"
  ON public.interview_feedback FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.interviews
      WHERE interviews.id = interview_feedback.interview_id
        AND interviews.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "feedback_update_via_interview" ON public.interview_feedback;
CREATE POLICY "feedback_update_via_interview"
  ON public.interview_feedback FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.interviews
      WHERE interviews.id = interview_feedback.interview_id
        AND interviews.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.interviews
      WHERE interviews.id = interview_feedback.interview_id
        AND interviews.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "feedback_delete_via_interview" ON public.interview_feedback;
CREATE POLICY "feedback_delete_via_interview"
  ON public.interview_feedback FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.interviews
      WHERE interviews.id = interview_feedback.interview_id
        AND interviews.user_id = auth.uid()
    )
  );

-- Confidence Logs table
ALTER TABLE public.confidence_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "confidence_logs_select_own" ON public.confidence_logs;
CREATE POLICY "confidence_logs_select_own"
  ON public.confidence_logs FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "confidence_logs_insert_own" ON public.confidence_logs;
CREATE POLICY "confidence_logs_insert_own"
  ON public.confidence_logs FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "confidence_logs_update_own" ON public.confidence_logs;
CREATE POLICY "confidence_logs_update_own"
  ON public.confidence_logs FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "confidence_logs_delete_own" ON public.confidence_logs;
CREATE POLICY "confidence_logs_delete_own"
  ON public.confidence_logs FOR DELETE
  USING (user_id = auth.uid());

-- Add foreign key constraint for user_id (references profiles)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'interviews_user_id_fkey'
  ) THEN
    ALTER TABLE public.interviews 
      ADD CONSTRAINT interviews_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'confidence_logs_user_id_fkey'
  ) THEN
    ALTER TABLE public.confidence_logs 
      ADD CONSTRAINT confidence_logs_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END$$;

-- Comments
COMMENT ON TABLE public.interviews IS 'Detailed interview records for performance tracking and analytics';
COMMENT ON TABLE public.interview_feedback IS 'Feedback and themes from interviews for improvement tracking';
COMMENT ON TABLE public.confidence_logs IS 'User confidence and anxiety tracking over time';
