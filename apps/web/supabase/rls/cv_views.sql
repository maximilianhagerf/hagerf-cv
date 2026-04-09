-- RLS policies for cv_views table
-- cv_views records are inserted by the application (service role) on public CV access.
-- Individual users should not be able to see or manipulate other users' view records.
ALTER TABLE cv_views ENABLE ROW LEVEL SECURITY;

-- Only the owner of the cv_document can read its views
CREATE POLICY "cv_views_select_own"
  ON cv_views FOR SELECT
  USING (
    cv_document_id IN (
      SELECT id FROM cv_documents WHERE user_id = auth.uid()
    )
  );

-- Inserts are performed by the application via service role; no user-level insert policy needed.
-- To allow analytics inserts from authenticated context if desired in future:
-- CREATE POLICY "cv_views_insert_public" ON cv_views FOR INSERT WITH CHECK (true);
