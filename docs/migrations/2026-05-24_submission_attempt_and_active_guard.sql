-- Ensure attempt number exists and defaults to 1 (additive safeguard).
ALTER TABLE public.submissions
  ADD COLUMN IF NOT EXISTS attempt_no smallint NOT NULL DEFAULT 1;

-- Keep attempt values positive.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'submissions_attempt_no_check'
  ) THEN
    ALTER TABLE public.submissions
      ADD CONSTRAINT submissions_attempt_no_check
      CHECK (attempt_no >= 1);
  END IF;
END $$;

-- Prevent duplicate active submissions for the same student+exam.
CREATE UNIQUE INDEX IF NOT EXISTS submissions_one_active_per_student_exam_idx
  ON public.submissions (exam_id, student_id)
  WHERE status = 'in_progress';

