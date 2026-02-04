-- Migration: Client Project Requests
-- Allow client users to submit project requests from the client portal

-- Add column to track client-initiated requests
ALTER TABLE projects ADD COLUMN IF NOT EXISTS requested_by_client BOOLEAN DEFAULT FALSE;

-- Create index for filtering client-initiated requests
CREATE INDEX IF NOT EXISTS idx_projects_requested_by_client ON projects(requested_by_client) WHERE requested_by_client = TRUE;

-- Drop existing policy if it exists (for idempotent migrations)
DROP POLICY IF EXISTS "client_users_create_requests" ON projects;

-- RLS Policy: Allow client_user to INSERT projects for their client
-- This enables clients to submit PR requests directly
CREATE POLICY "client_users_create_requests" ON projects
FOR INSERT WITH CHECK (
  -- User must be linked to the client via client_users table
  EXISTS (
    SELECT 1 FROM client_users cu
    JOIN clients c ON cu.client_id = c.id
    WHERE cu.user_id = auth.uid()
      AND c.id = client_id
      AND c.organization_id = organization_id
  )
  -- User must have client_user role
  AND EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'client_user'
  )
  -- Status must be 'requested' for client-created projects
  AND status = 'requested'
  -- Must be marked as client-initiated
  AND requested_by_client = TRUE
);

-- Comment for documentation
COMMENT ON COLUMN projects.requested_by_client IS 'TRUE if project was initiated by a client user from the client portal';
COMMENT ON POLICY "client_users_create_requests" ON projects IS 'Allows client users to create project requests for their own client';
