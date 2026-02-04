-- =====================================================
-- Migration: Add RLS policies for client_users table
-- =====================================================
-- The client_users table had RLS enabled but no policies,
-- preventing users from querying their own client assignments.

-- Allow users to see their own client assignments
CREATE POLICY "Users can view their own client assignments"
ON client_users FOR SELECT
USING (user_id = auth.uid());

-- Note: PR admin management of client_users is handled through
-- the clients table RLS policies. Direct INSERT/UPDATE/DELETE
-- on client_users should be done via service role or
-- a security definer function to avoid RLS recursion issues.
