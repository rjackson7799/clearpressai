-- ============================================================
-- ClearPress AI — Phase 2 T1
-- Storage bucket for brand voice samples (PDF/DOCX/TXT, max 10 MB)
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'brand-voice-samples',
  'brand-voice-samples',
  false,
  10485760,
  array[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- RLS policies on storage.objects scoped to this bucket.
-- Mirror the uniform `firm_users_full_access` model used on public tables:
-- any authenticated user gets full access.

create policy "brand_voice_samples_select"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'brand-voice-samples');

create policy "brand_voice_samples_insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'brand-voice-samples');

create policy "brand_voice_samples_update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'brand-voice-samples')
  with check (bucket_id = 'brand-voice-samples');

create policy "brand_voice_samples_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'brand-voice-samples');
