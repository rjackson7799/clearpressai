-- ============================================================
-- ClearPress AI v1 — initial schema (TSD §4)
-- ============================================================

-- USERS (mirrors auth.users 1:1)
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null,
  full_name_kana text,
  role text not null default 'internal_user',
  language_pref text not null default 'ja' check (language_pref in ('ja', 'en')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- CLIENTS
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  name_en text,
  industry text not null default 'pharmaceutical',
  primary_contact_name text,
  primary_contact_email text,
  notes text,
  created_by uuid not null references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_clients_name on public.clients(name);

-- BRAND VOICE PROFILES
create table public.brand_voice_profiles (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null unique references public.clients(id) on delete cascade,
  extraction_run_id text,
  prompt_version text,
  model_used text,
  tone_keywords jsonb not null default '[]',
  stylistic_patterns jsonb not null default '[]',
  preferred_vocabulary jsonb not null default '[]',
  words_to_avoid jsonb not null default '[]',
  signature_phrases jsonb not null default '[]',
  length_norms jsonb not null default '{}',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_voice_profiles_client on public.brand_voice_profiles(client_id);

-- BRAND VOICE SAMPLES
create table public.brand_voice_samples (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  filename text not null,
  storage_path text not null,
  mime_type text not null,
  byte_size int not null,
  content_text text,
  uploaded_by uuid not null references public.users(id),
  uploaded_at timestamptz not null default now()
);
create index idx_voice_samples_client on public.brand_voice_samples(client_id);

-- BRAND VOICE GUIDELINES
create table public.brand_voice_guidelines (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  source_type text not null check (source_type in ('client_feedback', 'internal_annotation', 'extraction', 'legal_review')),
  source_reference_id uuid,
  guideline_text text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index idx_voice_guidelines_client on public.brand_voice_guidelines(client_id);

-- PROJECTS
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id),
  name text not null,
  status text not null default 'draft' check (status in ('draft', 'in_review', 'delivered', 'feedback_received', 'completed')),
  urgency text not null default 'standard' check (urgency in ('standard', 'priority', 'urgent', 'crisis')),
  deadline timestamptz,
  created_by uuid not null references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_projects_client on public.projects(client_id);
create index idx_projects_status on public.projects(status);

-- CONTENT ITEMS
create table public.content_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  content_type text not null check (content_type in ('press_release', 'blog_post', 'social_media', 'internal_memo', 'faq', 'executive_statement')),
  brief_free_text text not null,
  brief_key_messages jsonb not null default '[]',
  brief_quotes jsonb not null default '[]',
  brief_data_points jsonb not null default '[]',
  brief_constraints text,
  variation_axis text not null default 'tone' check (variation_axis in ('tone', 'structure', 'length')),
  language text not null default 'ja' check (language in ('ja', 'en')),
  created_at timestamptz not null default now()
);

-- CONTENT VARIANTS
create table public.content_variants (
  id uuid primary key default gen_random_uuid(),
  content_item_id uuid not null references public.content_items(id) on delete cascade,
  variant_label text not null,
  variant_index int not null check (variant_index between 1 and 3),
  body_text text not null,
  body_html text,
  char_count int not null default 0,
  reading_time_seconds int not null default 0,
  internal_approved boolean not null default false,
  internal_approved_by uuid references public.users(id),
  internal_approved_at timestamptz,
  model_used text not null,
  generation_params jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (content_item_id, variant_index)
);
create index idx_variants_item on public.content_variants(content_item_id);

-- COMPLIANCE FINDINGS
create table public.compliance_findings (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references public.content_variants(id) on delete cascade,
  severity text not null check (severity in ('blocker', 'warning', 'note')),
  source_text text not null,
  paragraph_index int,
  explanation text not null,
  regulation_reference text not null,
  suggested_correction text,
  resolution_status text not null default 'unresolved' check (resolution_status in ('unresolved', 'fixed', 'acknowledged')),
  resolved_by uuid references public.users(id),
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);
create index idx_findings_variant on public.compliance_findings(variant_id);

-- AUDIT REPORTS
create table public.audit_reports (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  report_id_display text not null,
  version text not null default '1.0',
  previous_version_id uuid references public.audit_reports(id),
  status text not null default 'draft' check (status in ('draft', 'finalized', 'revised')),
  reviewer_comments text,
  created_by uuid not null references public.users(id),
  created_at timestamptz not null default now(),
  finalized_at timestamptz
);
create index idx_audit_project on public.audit_reports(project_id);

-- AUDIT SIGNATURES
create table public.audit_signatures (
  id uuid primary key default gen_random_uuid(),
  audit_report_id uuid not null references public.audit_reports(id) on delete cascade,
  signer_id uuid not null references public.users(id),
  signer_name_snapshot text not null,
  signer_role_snapshot text not null,
  signature_hash text not null,
  signed_at timestamptz not null default now()
);

-- AUDIT TRAIL EVENTS
create table public.audit_trail_events (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  audit_report_id uuid references public.audit_reports(id),
  event_type text not null check (event_type in ('variant_generated', 'compliance_checked', 'manual_review_started', 'fix_applied', 'compliance_rechecked', 'sign_off', 'delivery_sent', 'feedback_received', 'voice_updated')),
  actor_type text not null check (actor_type in ('system', 'user')),
  actor_id uuid,
  actor_name_snapshot text,
  details jsonb not null default '{}',
  model_used text,
  occurred_at timestamptz not null default now()
);
create index idx_audit_trail_project on public.audit_trail_events(project_id, occurred_at);

-- DELIVERIES
create table public.deliveries (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  recipient_email text not null,
  recipient_name text,
  cc_emails jsonb not null default '[]',
  bcc_emails jsonb not null default '[]',
  subject text not null,
  body_html text not null,
  body_text text,
  variant_ids_attached jsonb not null default '[]',
  attachment_format text not null default 'both' check (attachment_format in ('pdf', 'word', 'both')),
  status text not null default 'draft' check (status in ('draft', 'scheduled', 'sent', 'failed')),
  sent_at timestamptz,
  sent_by uuid references public.users(id),
  created_at timestamptz not null default now()
);

-- SCHEDULED SENDS
create table public.scheduled_sends (
  id uuid primary key default gen_random_uuid(),
  delivery_id uuid not null references public.deliveries(id) on delete cascade,
  scheduled_for timestamptz not null,
  processed boolean not null default false,
  processed_at timestamptz,
  error_message text,
  created_at timestamptz not null default now()
);
create index idx_scheduled_processing on public.scheduled_sends(scheduled_for, processed) where processed = false;

-- FEEDBACK TOKENS
create table public.feedback_tokens (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  delivery_id uuid not null references public.deliveries(id) on delete cascade,
  expires_at timestamptz not null,
  used_at timestamptz,
  reminder_sent_at timestamptz,
  created_at timestamptz not null default now()
);
create index idx_tokens_token on public.feedback_tokens(token);
create index idx_tokens_expires on public.feedback_tokens(expires_at) where used_at is null;

-- CLIENT FEEDBACK
create table public.client_feedback (
  id uuid primary key default gen_random_uuid(),
  feedback_token_id uuid not null references public.feedback_tokens(id),
  chosen_variant_id uuid not null references public.content_variants(id),
  what_worked jsonb not null default '[]',
  what_could_improve jsonb not null default '[]',
  needs_rework boolean not null default false,
  free_text_comment text,
  submitted_at timestamptz not null default now()
);

-- ============================================================
-- RLS (uniform policy for v1; multi-tenant deferred to v2)
-- ============================================================
alter table public.users                   enable row level security;
alter table public.clients                 enable row level security;
alter table public.brand_voice_profiles    enable row level security;
alter table public.brand_voice_samples     enable row level security;
alter table public.brand_voice_guidelines  enable row level security;
alter table public.projects                enable row level security;
alter table public.content_items           enable row level security;
alter table public.content_variants        enable row level security;
alter table public.compliance_findings     enable row level security;
alter table public.audit_reports           enable row level security;
alter table public.audit_signatures        enable row level security;
alter table public.audit_trail_events      enable row level security;
alter table public.deliveries              enable row level security;
alter table public.scheduled_sends         enable row level security;
alter table public.feedback_tokens         enable row level security;
alter table public.client_feedback         enable row level security;

create policy firm_users_full_access on public.users                  for all using (auth.role() = 'authenticated');
create policy firm_users_full_access on public.clients                for all using (auth.role() = 'authenticated');
create policy firm_users_full_access on public.brand_voice_profiles   for all using (auth.role() = 'authenticated');
create policy firm_users_full_access on public.brand_voice_samples    for all using (auth.role() = 'authenticated');
create policy firm_users_full_access on public.brand_voice_guidelines for all using (auth.role() = 'authenticated');
create policy firm_users_full_access on public.projects               for all using (auth.role() = 'authenticated');
create policy firm_users_full_access on public.content_items          for all using (auth.role() = 'authenticated');
create policy firm_users_full_access on public.content_variants       for all using (auth.role() = 'authenticated');
create policy firm_users_full_access on public.compliance_findings    for all using (auth.role() = 'authenticated');
create policy firm_users_full_access on public.audit_reports          for all using (auth.role() = 'authenticated');
create policy firm_users_full_access on public.audit_signatures       for all using (auth.role() = 'authenticated');
create policy firm_users_full_access on public.audit_trail_events     for all using (auth.role() = 'authenticated');
create policy firm_users_full_access on public.deliveries             for all using (auth.role() = 'authenticated');
create policy firm_users_full_access on public.scheduled_sends        for all using (auth.role() = 'authenticated');
create policy firm_users_full_access on public.feedback_tokens        for all using (auth.role() = 'authenticated');
create policy firm_users_full_access on public.client_feedback        for all using (auth.role() = 'authenticated');

-- ============================================================
-- auth.users -> public.users sync trigger
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
