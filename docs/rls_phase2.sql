-- Phase 2 RBAC / isolation policies
-- Apply in Supabase SQL editor after validating role and FK consistency.

alter table public.profiles enable row level security;
alter table public.students enable row level security;
alter table public.faculty enable row level security;
alter table public.programs enable row level security;
alter table public.exams enable row level security;
alter table public.submissions enable row level security;

drop policy if exists profiles_select_self on public.profiles;
create policy profiles_select_self on public.profiles
for select to authenticated
using (id = auth.uid());

drop policy if exists students_select_own_scope on public.students;
create policy students_select_own_scope on public.students
for select to authenticated
using (
  id = auth.uid()
  or exists (
    select 1
    from public.profiles p
    join public.faculty f on f.user_id = p.id
    where p.id = auth.uid() and p.role = 'faculty' and f.program_id = students.program_id
  )
  or exists (
    select 1
    from public.profiles p
    join public.admins a on a.user_id = p.id
    where p.id = auth.uid() and p.role = 'admin' and a.school_id = students.school_id
  )
);

drop policy if exists faculty_select_school_scope on public.faculty;
create policy faculty_select_school_scope on public.faculty
for select to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.profiles p
    join public.admins a on a.user_id = p.id
    where p.id = auth.uid()
      and p.role = 'admin'
      and a.school_id = faculty.school_id
  )
);

drop policy if exists programs_select_scope on public.programs;
create policy programs_select_scope on public.programs
for select to authenticated
using (
  exists (
    select 1
    from public.students s
    where s.id = auth.uid() and s.program_id = programs.id
  )
  or exists (
    select 1
    from public.faculty f
    where f.user_id = auth.uid() and f.program_id = programs.id
  )
  or exists (
    select 1
    from public.profiles p
    join public.admins a on a.user_id = p.id
    where p.id = auth.uid() and p.role = 'admin' and a.school_id = programs.school_id
  )
);

drop policy if exists exams_select_scope on public.exams;
create policy exams_select_scope on public.exams
for select to authenticated
using (
  exists (
    select 1
    from public.students s
    where s.id = auth.uid() and s.program_id = exams.program_id
  )
  or exists (
    select 1
    from public.faculty f
    where f.user_id = auth.uid() and f.program_id = exams.program_id
  )
  or exists (
    select 1
    from public.profiles p
    join public.admins a on a.user_id = p.id
    join public.programs pg on pg.id = exams.program_id
    where p.id = auth.uid() and p.role = 'admin' and a.school_id = pg.school_id
  )
);

drop policy if exists exams_faculty_crud_own_program on public.exams;
create policy exams_faculty_crud_own_program on public.exams
for all to authenticated
using (
  exists (
    select 1
    from public.faculty f
    where f.user_id = auth.uid()
      and f.program_id = exams.program_id
      and exams.created_by = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.faculty f
    where f.user_id = auth.uid()
      and f.program_id = exams.program_id
      and exams.created_by = auth.uid()
  )
);

drop policy if exists submissions_select_scope on public.submissions;
create policy submissions_select_scope on public.submissions
for select to authenticated
using (
  exists (
    select 1 from public.students s
    where s.id = auth.uid() and s.id = submissions.student_id
  )
  or exists (
    select 1 from public.faculty f
    where f.user_id = auth.uid() and f.program_id = submissions.program_id
  )
  or exists (
    select 1
    from public.profiles p
    join public.admins a on a.user_id = p.id
    join public.programs pg on pg.id = submissions.program_id
    where p.id = auth.uid() and p.role = 'admin' and a.school_id = pg.school_id
  )
);
