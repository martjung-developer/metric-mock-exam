alter table public.practice_exams
  add column if not exists program_id uuid;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'practice_exams_program_id_fkey'
  ) then
    alter table public.practice_exams
      add constraint practice_exams_program_id_fkey
      foreign key (program_id)
      references public.programs(id);
  end if;
end $$;
