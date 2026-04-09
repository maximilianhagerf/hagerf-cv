-- RLS policies for cv_documents table
ALTER TABLE cv_documents ENABLE ROW LEVEL SECURITY;

-- Authenticated owner can read their own CVs
CREATE POLICY "cv_documents_select_own"
  ON cv_documents FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "cv_documents_insert_own"
  ON cv_documents FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "cv_documents_update_own"
  ON cv_documents FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "cv_documents_delete_own"
  ON cv_documents FOR DELETE
  USING (user_id = auth.uid());

-- Public (anonymous) read access for public CVs via share_token lookups
-- (unauthenticated reads are handled at the application layer using the service role key)
