-- Optional compatibility table for exam approval queue.
-- Existing VERIPRAXIS workflow already uses exams.approval_status + approval_events.
-- This table is added only if your deployment still requires a dedicated queue table.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'exam_approvals'
  ) THEN
    CREATE TABLE public.exam_approvals (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      exam_id uuid NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
      submitted_by uuid NOT NULL REFERENCES public.profiles(id),
      status text NOT NULL CHECK (status IN ('pending','approved','rejected')) DEFAULT 'pending',
      reviewer_id uuid NULL REFERENCES public.profiles(id),
      review_note text NULL,
      submitted_at timestamptz NOT NULL DEFAULT now(),
      reviewed_at timestamptz NULL
    );

    CREATE INDEX exam_approvals_exam_id_idx ON public.exam_approvals(exam_id);
    CREATE INDEX exam_approvals_status_idx ON public.exam_approvals(status);
    CREATE INDEX exam_approvals_submitted_by_idx ON public.exam_approvals(submitted_by);
  END IF;
END $$;

