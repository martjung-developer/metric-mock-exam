-- DRAFT ONLY: Table of Specifications areas.
-- Do not apply without review.

create table if not exists public.exam_tos_areas (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.exams(id) on delete cascade,
  area_title text not null check (length(btrim(area_title)) > 0),
  weight_percent numeric(5, 2) not null check (weight_percent >= 0 and weight_percent <= 100),
  expected_items integer not null check (expected_items >= 0),
  min_percent numeric(5, 2) not null check (min_percent >= 0 and min_percent <= 100),
  is_temporary boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint exam_tos_areas_exam_area_unique unique (exam_id, area_title)
);

comment on column public.exam_tos_areas.is_temporary is
  'true until replaced by the official PRC/CHED TOS';

create index if not exists exam_tos_areas_exam_id_idx
  on public.exam_tos_areas (exam_id);

alter table public.exam_tos_areas enable row level security;

create policy "exam_tos_areas_select_by_role"
  on public.exam_tos_areas
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = any (array['admin'::text, 'faculty'::text])
    )
    or exists (
      select 1
      from public.exams e
      where e.id = exam_tos_areas.exam_id
        and e.is_published = true
    )
  );

create policy "exam_tos_areas_insert_by_role"
  on public.exam_tos_areas
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = any (array['admin'::text, 'faculty'::text])
    )
  );

create policy "exam_tos_areas_update_by_role"
  on public.exam_tos_areas
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = any (array['admin'::text, 'faculty'::text])
    )
  )
  with check (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = any (array['admin'::text, 'faculty'::text])
    )
  );

create policy "exam_tos_areas_delete_by_role"
  on public.exam_tos_areas
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = any (array['admin'::text, 'faculty'::text])
    )
  );
