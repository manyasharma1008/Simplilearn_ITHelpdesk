-- Run ONCE in the Supabase SQL editor (safe to run again).
-- Creates the public "attachments" bucket used for screenshots on tickets.
-- DEMO policies: the anon key can upload and read. Tighten with auth before real use.
insert into storage.buckets (id, name, public) values ('attachments', 'attachments', true)
on conflict (id) do update set public = true;

drop policy if exists "demo attachments insert" on storage.objects;
drop policy if exists "demo attachments read" on storage.objects;
create policy "demo attachments insert" on storage.objects for insert to anon with check (bucket_id = 'attachments');
create policy "demo attachments read"   on storage.objects for select to anon using (bucket_id = 'attachments');
