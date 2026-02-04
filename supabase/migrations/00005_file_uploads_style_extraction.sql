-- Migration: File Uploads and Style Extraction
-- Extend file categories and add extraction tracking for AI style analysis

-- =====================================================
-- 1. EXTEND FILE CATEGORIES
-- =====================================================

-- Drop existing constraint and add new one with extended categories
ALTER TABLE files DROP CONSTRAINT IF EXISTS files_category_check;
ALTER TABLE files ADD CONSTRAINT files_category_check CHECK (
  category IN (
    'reference',
    'brand_guidelines',
    'tone_example',
    'previous_press_release',
    'style_reference',
    'asset',
    'export'
  )
);

-- =====================================================
-- 2. ADD EXTRACTION TRACKING COLUMNS
-- =====================================================

-- Content text extracted from document (for searchability and AI analysis)
ALTER TABLE files ADD COLUMN IF NOT EXISTS content_text TEXT;

-- Extraction status for tracking AI processing
ALTER TABLE files ADD COLUMN IF NOT EXISTS extraction_status VARCHAR(20)
  DEFAULT 'pending'
  CHECK (extraction_status IN ('pending', 'processing', 'completed', 'failed'));

-- Timestamp when extraction was completed
ALTER TABLE files ADD COLUMN IF NOT EXISTS extracted_at TIMESTAMPTZ;

-- =====================================================
-- 3. ADD INDEXES FOR PERFORMANCE
-- =====================================================

-- Index for client style files (used when fetching style references)
CREATE INDEX IF NOT EXISTS idx_files_client_style ON files(client_id, category)
  WHERE category IN ('brand_guidelines', 'tone_example', 'previous_press_release', 'style_reference');

-- Index for extraction status (used when processing pending extractions)
CREATE INDEX IF NOT EXISTS idx_files_extraction_pending ON files(extraction_status)
  WHERE extraction_status = 'pending';

-- =====================================================
-- 4. RLS POLICIES FOR FILES
-- =====================================================

-- Drop existing policies if they exist (for idempotent migrations)
DROP POLICY IF EXISTS "files_select_organization" ON files;
DROP POLICY IF EXISTS "files_insert_organization" ON files;
DROP POLICY IF EXISTS "files_delete_own_or_admin" ON files;
DROP POLICY IF EXISTS "client_users_view_files" ON files;
DROP POLICY IF EXISTS "client_users_upload_files" ON files;

-- Enable RLS on files table
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

-- PR Admin/Staff can view files in their organization
CREATE POLICY "files_select_organization" ON files
FOR SELECT USING (
  organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  )
);

-- PR Admin/Staff can insert files for their organization
CREATE POLICY "files_insert_organization" ON files
FOR INSERT WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  )
  AND uploaded_by = auth.uid()
);

-- Users can delete their own files, admins can delete any in their org
CREATE POLICY "files_delete_own_or_admin" ON files
FOR DELETE USING (
  (uploaded_by = auth.uid())
  OR (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid() AND role = 'pr_admin'
    )
  )
);

-- Client users can view files for their assigned client
CREATE POLICY "client_users_view_files" ON files
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM client_users cu
    WHERE cu.user_id = auth.uid()
      AND cu.client_id = files.client_id
  )
);

-- Client users can upload files for their client
CREATE POLICY "client_users_upload_files" ON files
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM client_users cu
    JOIN clients c ON cu.client_id = c.id
    WHERE cu.user_id = auth.uid()
      AND cu.client_id = client_id
      AND c.organization_id = organization_id
  )
  AND uploaded_by = auth.uid()
);

-- =====================================================
-- 5. DOCUMENTATION
-- =====================================================

COMMENT ON COLUMN files.content_text IS 'Extracted text content from the file for AI analysis and search';
COMMENT ON COLUMN files.extraction_status IS 'Status of AI content extraction: pending, processing, completed, failed';
COMMENT ON COLUMN files.extracted_at IS 'Timestamp when content extraction was completed';

COMMENT ON CONSTRAINT files_category_check ON files IS 'Extended file categories for style reference uploads';
