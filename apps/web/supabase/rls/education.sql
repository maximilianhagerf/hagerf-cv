-- RLS policies for education table
ALTER TABLE education ENABLE ROW LEVEL SECURITY;

CREATE POLICY "education_select_own"
  ON education FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "education_insert_own"
  ON education FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "education_update_own"
  ON education FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "education_delete_own"
  ON education FOR DELETE
  USING (user_id = auth.uid());
