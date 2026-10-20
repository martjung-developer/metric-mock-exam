alter table public.storage_files
  add column if not exists file_hash text;
