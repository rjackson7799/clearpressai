-- ============================================================
-- ClearPress AI — Internal Feedback / issue tracker
--
-- WHAT
-- ----
-- A firm-internal tracker where staff submit bugs / feature requests /
-- improvements (message + optional screenshots) and triage each item
-- through pending -> in_progress -> completed.
--
-- This is DISTINCT from the client-facing feedback flow
-- (client_feedback / feedback_tokens / /f/:token). Names are namespaced
-- with `internal_` to avoid any collision.
--
-- HOW TO APPLY (per CLAUDE.md convention)
-- ---------------------------------------
-- Paste this whole file into the Supabase dashboard SQL editor for
-- project hsdqvlnzorjzxfaqijns and run, then reconcile the ledger:
--   npx supabase migration repair --status applied 0015 --linked
-- (repair the still-unrecorded 0004..0014 backlog too if not done).
--
-- After applying, seed the notification config via
-- op_feedback_notify_seed.sql, then deploy the notify-feedback function.
-- ============================================================

-- MAIN TABLE
-- created_by is NOT NULL (the hook always stamps it from auth), matching
-- brand_voice_samples.uploaded_by.
create table public.internal_feedback (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('bug', 'feature', 'improvement')),
  status text not null default 'pending'
    check (status in ('pending', 'in_progress', 'completed')),
  message text not null,
  created_by uuid not null references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ATTACHMENTS (one-to-many; mirrors brand_voice_samples shape).
-- Keeps the original filename for display / download naming, since the
-- storage key itself is UUID-based (see src/lib/utils/storage-key.ts).
create table public.internal_feedback_attachments (
  id uuid primary key default gen_random_uuid(),
  feedback_id uuid not null
    references public.internal_feedback(id) on delete cascade,
  filename text not null,
  storage_path text not null,
  mime_type text not null,
  byte_size int not null,
  uploaded_by uuid not null references public.users(id),
  created_at timestamptz not null default now()
);

-- Indexes for the list (order by created_at desc), the status filter,
-- and the attachments join.
create index idx_internal_feedback_status_created
  on public.internal_feedback(status, created_at desc);
create index idx_internal_feedback_created
  on public.internal_feedback(created_at desc);
create index idx_internal_feedback_attachments_feedback
  on public.internal_feedback_attachments(feedback_id);

-- RLS (uniform firm_users_full_access model, matching every other table).
alter table public.internal_feedback             enable row level security;
alter table public.internal_feedback_attachments enable row level security;

create policy firm_users_full_access on public.internal_feedback
  for all using (auth.role() = 'authenticated');
create policy firm_users_full_access on public.internal_feedback_attachments
  for all using (auth.role() = 'authenticated');

-- ============================================================
-- Storage bucket for feedback screenshots (images only, max 5 MB).
-- Private; clone of 0002_storage_brand_voice_samples.sql.
-- ============================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'feedback-attachments',
  'feedback-attachments',
  false,
  5242880,
  array[
    'image/png',
    'image/jpeg',
    'image/gif',
    'image/webp'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "feedback_attachments_select"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'feedback-attachments');

create policy "feedback_attachments_insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'feedback-attachments');

create policy "feedback_attachments_update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'feedback-attachments')
  with check (bucket_id = 'feedback-attachments');

create policy "feedback_attachments_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'feedback-attachments');
