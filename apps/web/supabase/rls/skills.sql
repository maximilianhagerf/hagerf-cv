-- RLS policies for skills table
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "skills_select_own"
  ON skills FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "skills_insert_own"
  ON skills FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "skills_update_own"
  ON skills FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "skills_delete_own"
  ON skills FOR DELETE
  USING (user_id = auth.uid());
