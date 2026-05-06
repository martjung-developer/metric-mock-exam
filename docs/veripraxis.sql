-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.admins (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE,
  admin_id text NOT NULL UNIQUE,
  full_name text NOT NULL,
  email text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  school_id uuid,
  CONSTRAINT admins_pkey PRIMARY KEY (id),
  CONSTRAINT admins_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT admins_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id)
);
CREATE TABLE public.analytics (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  student_id uuid,
  exam_id uuid,
  category_id uuid,
  total_attempts integer DEFAULT 0,
  average_score numeric,
  highest_score numeric,
  lowest_score numeric,
  total_time_spent_minutes integer DEFAULT 0,
  last_attempt_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  program_id uuid,
  CONSTRAINT analytics_pkey PRIMARY KEY (id),
  CONSTRAINT analytics_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id),
  CONSTRAINT analytics_exam_id_fkey FOREIGN KEY (exam_id) REFERENCES public.exams(id),
  CONSTRAINT analytics_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.exam_categories(id),
  CONSTRAINT analytics_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id)
);
CREATE TABLE public.answers (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  submission_id uuid,
  question_id uuid,
  answer_text text,
  is_correct boolean,
  points_earned numeric,
  graded_by uuid,
  feedback text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT answers_pkey PRIMARY KEY (id),
  CONSTRAINT answers_submission_id_fkey FOREIGN KEY (submission_id) REFERENCES public.submissions(id),
  CONSTRAINT answers_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.questions(id),
  CONSTRAINT answers_graded_by_fkey FOREIGN KEY (graded_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.exam_assignments (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  exam_id uuid,
  student_id uuid,
  program_id uuid,
  assigned_by uuid,
  assigned_at timestamp with time zone DEFAULT now(),
  deadline timestamp with time zone,
  is_active boolean DEFAULT true,
  CONSTRAINT exam_assignments_pkey PRIMARY KEY (id),
  CONSTRAINT exam_assignments_exam_id_fkey FOREIGN KEY (exam_id) REFERENCES public.exams(id),
  CONSTRAINT exam_assignments_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id),
  CONSTRAINT exam_assignments_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id),
  CONSTRAINT exam_assignments_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.exam_categories (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL UNIQUE,
  description text,
  icon text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT exam_categories_pkey PRIMARY KEY (id)
);
CREATE TABLE public.exams (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  description text,
  category_id uuid,
  duration_minutes integer NOT NULL,
  passing_score numeric NOT NULL,
  total_points integer NOT NULL,
  is_published boolean DEFAULT false,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  exam_type text NOT NULL DEFAULT 'mock'::text CHECK (exam_type = ANY (ARRAY['mock'::text, 'practice'::text])),
  program_id uuid,
  grading_mode text DEFAULT 'auto'::text,
  allowed_programs ARRAY,
  allowed_year_levels ARRAY,
  program text,
  CONSTRAINT exams_pkey PRIMARY KEY (id),
  CONSTRAINT exams_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.exam_categories(id),
  CONSTRAINT exams_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id),
  CONSTRAINT exams_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id)
);
CREATE TABLE public.faculty (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE,
  faculty_id text NOT NULL UNIQUE,
  full_name text NOT NULL,
  email text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  role_type text CHECK (role_type = ANY (ARRAY['professional'::text, 'major'::text, 'minor'::text])),
  program_id uuid,
  school_id uuid,
  CONSTRAINT faculty_pkey PRIMARY KEY (id),
  CONSTRAINT faculty_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT faculty_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id),
  CONSTRAINT faculty_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id),
  CONSTRAINT faculty_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.favorites (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  material_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT favorites_pkey PRIMARY KEY (id),
  CONSTRAINT favorites_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT favorites_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.study_materials(id)
);
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type USER-DEFINED NOT NULL DEFAULT 'general'::notif_type,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.practice_completions (
  student_id uuid NOT NULL,
  exam_id uuid NOT NULL,
  completed_at timestamp with time zone DEFAULT now(),
  CONSTRAINT practice_completions_pkey PRIMARY KEY (student_id, exam_id),
  CONSTRAINT practice_completions_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.profiles(id),
  CONSTRAINT practice_completions_exam_id_fkey FOREIGN KEY (exam_id) REFERENCES public.exams(id)
);
CREATE TABLE public.practice_exams (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  description text,
  category_id uuid,
  content text,
  file_url text,
  created_by uuid,
  is_published boolean DEFAULT false,
  view_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT practice_exams_pkey PRIMARY KEY (id),
  CONSTRAINT reviewers_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.exam_categories(id),
  CONSTRAINT reviewers_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  email text NOT NULL UNIQUE,
  full_name text,
  role text NOT NULL CHECK (role = ANY (ARRAY['student'::text, 'admin'::text, 'faculty'::text])),
  avatar_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.programs (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  school_id uuid,
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  full_name text NOT NULL,
  degree_type text NOT NULL,
  major text,
  years integer DEFAULT 4,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT programs_pkey PRIMARY KEY (id),
  CONSTRAINT programs_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id)
);
CREATE TABLE public.questions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  exam_id uuid,
  question_text text NOT NULL,
  question_type USER-DEFINED NOT NULL,
  points integer NOT NULL DEFAULT 1,
  options jsonb,
  correct_answer text,
  explanation text,
  order_number integer,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  scenario text,
  CONSTRAINT questions_pkey PRIMARY KEY (id),
  CONSTRAINT questions_exam_id_fkey FOREIGN KEY (exam_id) REFERENCES public.exams(id),
  CONSTRAINT questions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.schools (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  full_name text NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT schools_pkey PRIMARY KEY (id)
);
CREATE TABLE public.storage_files (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_type text NOT NULL,
  file_size integer,
  uploaded_by uuid,
  purpose text CHECK (purpose = ANY (ARRAY['exam_questions'::text, 'reviewer'::text, 'profile_image'::text, 'other'::text])),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT storage_files_pkey PRIMARY KEY (id),
  CONSTRAINT storage_files_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.students (
  id uuid NOT NULL,
  student_id text NOT NULL UNIQUE,
  school text,
  year_level integer NOT NULL,
  target_exam text,
  created_at timestamp with time zone DEFAULT now(),
  program_id uuid NOT NULL,
  school_id uuid,
  user_id uuid UNIQUE,
  CONSTRAINT students_pkey PRIMARY KEY (id),
  CONSTRAINT students_id_fkey FOREIGN KEY (id) REFERENCES public.profiles(id),
  CONSTRAINT students_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id),
  CONSTRAINT students_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id),
  CONSTRAINT students_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.study_materials (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  description text,
  type text NOT NULL CHECK (type = ANY (ARRAY['document'::text, 'video'::text, 'notes'::text])),
  file_url text,
  notes_content text,
  program_id uuid,
  category text,
  is_published boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  external_url text,
  meeting_url text,
  link_type text CHECK (link_type IS NULL OR (link_type = ANY (ARRAY['video'::text, 'meeting'::text, 'drive'::text, 'other'::text]))),
  CONSTRAINT study_materials_pkey PRIMARY KEY (id),
  CONSTRAINT study_materials_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id),
  CONSTRAINT study_materials_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);
CREATE TABLE public.submissions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  exam_id uuid,
  student_id uuid,
  started_at timestamp with time zone DEFAULT now(),
  submitted_at timestamp with time zone,
  time_spent_seconds integer,
  status text DEFAULT 'in_progress'::text CHECK (status = ANY (ARRAY['in_progress'::text, 'submitted'::text, 'graded'::text, 'reviewed'::text, 'released'::text])),
  score numeric,
  percentage numeric,
  passed boolean,
  created_at timestamp with time zone DEFAULT now(),
  released_at timestamp with time zone,
  program_id uuid,
  year_level integer,
  attempt_no smallint NOT NULL DEFAULT 1 CHECK (attempt_no >= 1 AND attempt_no <= 3),
  CONSTRAINT submissions_pkey PRIMARY KEY (id),
  CONSTRAINT submissions_exam_id_fkey FOREIGN KEY (exam_id) REFERENCES public.exams(id),
  CONSTRAINT submissions_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id),
  CONSTRAINT submissions_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id)
);
CREATE TABLE public.support_tickets (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  subject text NOT NULL,
  category text NOT NULL DEFAULT 'other'::text,
  priority text NOT NULL DEFAULT 'normal'::text CHECK (priority = ANY (ARRAY['low'::text, 'normal'::text, 'high'::text, 'urgent'::text])),
  description text NOT NULL,
  status text NOT NULL DEFAULT 'open'::text CHECK (status = ANY (ARRAY['open'::text, 'in_progress'::text, 'resolved'::text, 'closed'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  resolved_at timestamp with time zone,
  CONSTRAINT support_tickets_pkey PRIMARY KEY (id),
  CONSTRAINT support_tickets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.users (
  id uuid NOT NULL,
  role text NOT NULL CHECK (role = ANY (ARRAY['student'::text, 'faculty'::text, 'admin'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);