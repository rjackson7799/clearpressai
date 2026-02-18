-- Add missing DELETE policy for projects table
-- Without this policy, RLS silently blocks all project deletions (returns 0 rows affected, no error)

CREATE POLICY "PR admins can delete projects"
ON projects FOR DELETE
USING (
  has_project_access(id)
  AND (SELECT role FROM users WHERE id = auth.uid()) = 'pr_admin'
);
