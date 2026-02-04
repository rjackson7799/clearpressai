-- =====================================================
-- RLS POLICIES FOR client_industries
-- =====================================================
-- This table links clients to industries. Access should be
-- controlled based on the parent client's organization.
--
-- Fix for: "new row violates row-level security policy for table 'client_industries'"
-- The table had RLS enabled but no policies defined.

-- PR users can view client industries for clients in their organization
CREATE POLICY "PR users can view client industries"
ON client_industries FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM clients
    WHERE clients.id = client_industries.client_id
    AND clients.organization_id = get_user_organization_id()
  )
);

-- PR Admins can manage client industries (full CRUD)
CREATE POLICY "PR Admins can manage client industries"
ON client_industries FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM clients
    WHERE clients.id = client_industries.client_id
    AND clients.organization_id = get_user_organization_id()
    AND is_pr_admin()
  )
);

-- PR Staff can also manage client industries (they can edit clients)
CREATE POLICY "PR Staff can manage client industries"
ON client_industries FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM clients
    WHERE clients.id = client_industries.client_id
    AND clients.organization_id = get_user_organization_id()
  )
);

-- Client users can view industries for their client
CREATE POLICY "Client users can view their client industries"
ON client_industries FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM client_users cu
    JOIN clients c ON c.id = cu.client_id
    WHERE cu.client_id = client_industries.client_id
    AND cu.user_id = auth.uid()
  )
);
