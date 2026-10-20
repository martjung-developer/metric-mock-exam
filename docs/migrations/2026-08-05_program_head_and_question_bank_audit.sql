alter table public.faculty
  add column if not exists is_program_head boolean not null default false;

alter table public.question_banks
  add column if not exists last_modified_by uuid,
  add column if not exists last_modified_at timestamp with time zone;

alter table public.questions
  add column if not exists last_modified_by uuid,
  add column if not exists last_modified_at timestamp with time zone;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'question_banks_last_modified_by_fkey'
      and conrelid = 'public.question_banks'::regclass
  ) then
    alter table public.question_banks
      add constraint question_banks_last_modified_by_fkey
      foreign key (last_modified_by) references public.profiles(id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'questions_last_modified_by_fkey'
      and conrelid = 'public.questions'::regclass
  ) then
    alter table public.questions
      add constraint questions_last_modified_by_fkey
      foreign key (last_modified_by) references public.profiles(id);
  end if;
end $$;
