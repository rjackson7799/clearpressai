-- ClearPress AI - Initial Database Schema
-- Version: 1.0
-- Created: 2025-01-31
--
-- Full schema documentation: /docs/DATABASE.md
-- This migration creates the complete database structure.

-- =====================================================
-- EXTENSIONS
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy text search

-- =====================================================
-- CUSTOM TYPES
-- =====================================================

-- User roles
CREATE TYPE user_role AS ENUM ('pr_admin', 'pr_staff', 'client_user');

-- Project status
CREATE TYPE project_status AS ENUM (
  'requested',
  'in_progress',
  'in_review',
  'approved',
  'completed',
  'archived'
);

-- Content status
CREATE TYPE content_status AS ENUM (
  'draft',
  'submitted',
  'in_review',
  'needs_revision',
  'approved'
);

-- Urgency level
CREATE TYPE urgency_level AS ENUM ('standard', 'priority', 'urgent', 'crisis');

-- Content type
CREATE TYPE content_type AS ENUM (
  'press_release',
  'blog_post',
  'social_media',
  'internal_memo',
  'faq',
  'executive_statement'
);

-- Notification type
CREATE TYPE notification_type AS ENUM (
  'project_request',
  'content_submitted',
  'comment_added',
  'approval_needed',
  'content_approved',
  'deadline_reminder'
);

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Organizations (multi-tenant root)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  logo_url TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'pr_staff',
  avatar_url TEXT,
  preferences JSONB DEFAULT '{"language": "ja"}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX users_email_idx ON users(email);
CREATE INDEX users_organization_idx ON users(organization_id);
CREATE INDEX users_role_idx ON users(role);

-- Industries
CREATE TABLE industries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug VARCHAR(50) UNIQUE NOT NULL,
  name_en VARCHAR(255) NOT NULL,
  name_ja VARCHAR(255) NOT NULL,
  icon VARCHAR(50),
  config JSONB DEFAULT '{}',
  compliance_rules TEXT,
  prompts JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clients
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  logo_url TEXT,
  settings JSONB DEFAULT '{}',
  style_profile JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX clients_organization_idx ON clients(organization_id);

-- Client Industries (many-to-many)
CREATE TABLE client_industries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  industry_id UUID NOT NULL REFERENCES industries(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, industry_id)
);

-- Client Users (which users belong to which clients)
CREATE TABLE client_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, user_id)
);

-- Projects
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  status project_status DEFAULT 'in_progress',
  urgency urgency_level DEFAULT 'standard',
  target_date DATE,
  brief TEXT NOT NULL,
  expanded_brief JSONB,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX projects_organization_idx ON projects(organization_id);
CREATE INDEX projects_client_idx ON projects(client_id);
CREATE INDEX projects_status_idx ON projects(status);
CREATE INDEX projects_created_by_idx ON projects(created_by);

-- Content Items
CREATE TABLE content_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  type content_type NOT NULL,
  title VARCHAR(255) NOT NULL,
  status content_status DEFAULT 'draft',
  current_version_id UUID,
  settings JSONB DEFAULT '{}',
  locked_by UUID REFERENCES users(id),
  locked_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX content_items_project_idx ON content_items(project_id);
CREATE INDEX content_items_status_idx ON content_items(status);

-- Content Versions
CREATE TABLE content_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_item_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL DEFAULT 1,
  content JSONB NOT NULL,
  compliance_score SMALLINT CHECK (compliance_score >= 0 AND compliance_score <= 100),
  compliance_details JSONB,
  word_count INTEGER DEFAULT 0,
  is_milestone BOOLEAN DEFAULT FALSE,
  milestone_name VARCHAR(255),
  generation_params JSONB,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX content_versions_item_idx ON content_versions(content_item_id);
CREATE INDEX content_versions_number_idx ON content_versions(content_item_id, version_number DESC);

-- Add foreign key for current_version_id after content_versions table exists
ALTER TABLE content_items
ADD CONSTRAINT content_items_current_version_fkey
FOREIGN KEY (current_version_id) REFERENCES content_versions(id);

-- Comments
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_item_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  version_id UUID REFERENCES content_versions(id),
  user_id UUID NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  position JSONB,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX comments_content_item_idx ON comments(content_item_id);
CREATE INDEX comments_parent_idx ON comments(parent_id);

-- Client Suggestions
CREATE TABLE client_suggestions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_item_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  version_id UUID NOT NULL REFERENCES content_versions(id),
  user_id UUID NOT NULL REFERENCES users(id),
  before_text TEXT NOT NULL,
  after_text TEXT NOT NULL,
  position JSONB NOT NULL,
  reason TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX client_suggestions_content_item_idx ON client_suggestions(content_item_id);

-- Approvals
CREATE TABLE approvals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_item_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  version_id UUID NOT NULL REFERENCES content_versions(id),
  user_id UUID NOT NULL REFERENCES users(id),
  status VARCHAR(20) NOT NULL CHECK (status IN ('approved', 'rejected', 'changes_requested')),
  feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX approvals_content_item_idx ON approvals(content_item_id);

-- Files
CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  storage_path TEXT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  size_bytes BIGINT NOT NULL,
  category VARCHAR(50) DEFAULT 'reference' CHECK (category IN ('reference', 'asset', 'export')),
  uploaded_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX files_organization_idx ON files(organization_id);
CREATE INDEX files_project_idx ON files(project_id);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  metadata JSONB,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX notifications_user_idx ON notifications(user_id);
CREATE INDEX notifications_unread_idx ON notifications(user_id, read) WHERE read = FALSE;

-- Audit Logs
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  action VARCHAR(50) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX audit_logs_organization_idx ON audit_logs(organization_id);
CREATE INDEX audit_logs_resource_idx ON audit_logs(resource_type, resource_id);
CREATE INDEX audit_logs_created_at_idx ON audit_logs(created_at DESC);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Get current user's organization ID
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS UUID AS $$
  SELECT organization_id FROM users WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Check if current user is PR Admin
CREATE OR REPLACE FUNCTION is_pr_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'pr_admin'
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Check if current user has access to a project
CREATE OR REPLACE FUNCTION has_project_access(project_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_role user_role;
  user_org UUID;
  project_org UUID;
  project_client UUID;
BEGIN
  SELECT role, organization_id INTO user_role, user_org
  FROM users WHERE id = auth.uid();

  IF user_role IS NULL THEN
    RETURN FALSE;
  END IF;

  SELECT organization_id, client_id INTO project_org, project_client
  FROM projects WHERE id = project_id;

  -- Different org = no access
  IF project_org != user_org THEN
    RETURN FALSE;
  END IF;

  -- PR Admin has access to all projects in org
  IF user_role = 'pr_admin' THEN
    RETURN TRUE;
  END IF;

  -- PR Staff has access (can be restricted later with assignments)
  IF user_role = 'pr_staff' THEN
    RETURN TRUE;
  END IF;

  -- Client user only has access to their client's projects
  IF user_role = 'client_user' THEN
    RETURN EXISTS (
      SELECT 1 FROM client_users
      WHERE user_id = auth.uid() AND client_id = project_client
    );
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE industries ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_industries ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Organizations policies
CREATE POLICY "Users can view their own organization"
ON organizations FOR SELECT
USING (id = get_user_organization_id());

CREATE POLICY "PR Admins can update their organization"
ON organizations FOR UPDATE
USING (id = get_user_organization_id() AND is_pr_admin());

-- Users policies
CREATE POLICY "Users can view users in their organization"
ON users FOR SELECT
USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can update their own profile"
ON users FOR UPDATE
USING (id = auth.uid());

CREATE POLICY "PR Admins can manage users in their organization"
ON users FOR ALL
USING (organization_id = get_user_organization_id() AND is_pr_admin());

-- Industries policies (public read)
CREATE POLICY "Anyone can view active industries"
ON industries FOR SELECT
USING (is_active = TRUE);

-- Clients policies
CREATE POLICY "PR users can view clients in their organization"
ON clients FOR SELECT
USING (organization_id = get_user_organization_id());

CREATE POLICY "PR Admins can manage clients"
ON clients FOR ALL
USING (organization_id = get_user_organization_id() AND is_pr_admin());

CREATE POLICY "PR Staff can update clients"
ON clients FOR UPDATE
USING (organization_id = get_user_organization_id());

-- Client users can view their own client
CREATE POLICY "Client users can view their client"
ON clients FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM client_users cu
    WHERE cu.client_id = clients.id AND cu.user_id = auth.uid()
  )
);

-- Projects policies
CREATE POLICY "Users can view projects they have access to"
ON projects FOR SELECT
USING (has_project_access(id));

CREATE POLICY "PR users can create projects"
ON projects FOR INSERT
WITH CHECK (
  organization_id = get_user_organization_id()
);

CREATE POLICY "PR users can update projects"
ON projects FOR UPDATE
USING (has_project_access(id));

-- Content items policies
CREATE POLICY "Users can view content items in accessible projects"
ON content_items FOR SELECT
USING (has_project_access(project_id));

CREATE POLICY "PR users can create content items"
ON content_items FOR INSERT
WITH CHECK (has_project_access(project_id));

CREATE POLICY "PR users can update content items"
ON content_items FOR UPDATE
USING (has_project_access(project_id));

-- Content versions policies
CREATE POLICY "Users can view content versions"
ON content_versions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM content_items ci
    WHERE ci.id = content_versions.content_item_id
    AND has_project_access(ci.project_id)
  )
);

CREATE POLICY "PR users can create content versions"
ON content_versions FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM content_items ci
    WHERE ci.id = content_versions.content_item_id
    AND has_project_access(ci.project_id)
  )
);

-- Comments policies
CREATE POLICY "Users can view comments on accessible content"
ON comments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM content_items ci
    WHERE ci.id = comments.content_item_id
    AND has_project_access(ci.project_id)
  )
);

CREATE POLICY "Users can create comments on accessible content"
ON comments FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM content_items ci
    WHERE ci.id = comments.content_item_id
    AND has_project_access(ci.project_id)
  )
  AND user_id = auth.uid()
);

-- Notifications policies
CREATE POLICY "Users can view their own notifications"
ON notifications FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
ON notifications FOR UPDATE
USING (user_id = auth.uid());

-- Audit logs policies (PR Admin only)
CREATE POLICY "PR Admins can view audit logs"
ON audit_logs FOR SELECT
USING (organization_id = get_user_organization_id() AND is_pr_admin());

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER organizations_updated_at
BEFORE UPDATE ON organizations
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER clients_updated_at
BEFORE UPDATE ON clients
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER projects_updated_at
BEFORE UPDATE ON projects
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER content_items_updated_at
BEFORE UPDATE ON content_items
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER comments_updated_at
BEFORE UPDATE ON comments
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-increment version number
CREATE OR REPLACE FUNCTION set_version_number()
RETURNS TRIGGER AS $$
BEGIN
  SELECT COALESCE(MAX(version_number), 0) + 1 INTO NEW.version_number
  FROM content_versions
  WHERE content_item_id = NEW.content_item_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER content_versions_set_number
BEFORE INSERT ON content_versions
FOR EACH ROW EXECUTE FUNCTION set_version_number();

-- =====================================================
-- SEED DATA (Industries)
-- =====================================================

INSERT INTO industries (slug, name_en, name_ja, icon, config, is_active) VALUES
('pharmaceutical', 'Pharmaceutical', '製薬', 'pill', '{
  "content_types": ["press_release", "blog_post", "social_media", "internal_memo", "faq", "executive_statement"],
  "compliance_categories": ["regulatory_claims", "safety_info", "fair_balance", "substantiation", "hcp_communication", "patient_communication"],
  "required_elements": {
    "press_release": ["isi_section", "approved_indications", "company_boilerplate", "medical_contact"],
    "blog_post": ["medical_disclaimer", "hcp_consultation_note"],
    "social_media": ["isi_reference", "character_limit_compliance"]
  }
}', TRUE),
('healthcare', 'Healthcare', 'ヘルスケア', 'heart', '{
  "content_types": ["press_release", "blog_post", "social_media", "internal_memo", "faq"],
  "compliance_categories": ["medical_claims", "privacy_compliance", "substantiation"],
  "required_elements": {}
}', TRUE),
('technology', 'Technology', 'テクノロジー', 'cpu', '{
  "content_types": ["press_release", "blog_post", "social_media", "internal_memo", "faq", "executive_statement"],
  "compliance_categories": ["accuracy", "data_privacy"],
  "required_elements": {}
}', TRUE),
('finance', 'Finance', '金融', 'building', '{
  "content_types": ["press_release", "blog_post", "social_media", "internal_memo", "faq", "executive_statement"],
  "compliance_categories": ["regulatory_compliance", "forward_looking_statements", "fair_disclosure"],
  "required_elements": {}
}', TRUE);

-- Done!
COMMENT ON DATABASE postgres IS 'ClearPress AI - Multi-tenant PR SaaS Platform';
