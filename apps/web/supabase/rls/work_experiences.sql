-- RLS policies for work_experiences table
ALTER TABLE work_experiences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "work_experiences_select_own"
  ON work_experiences FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "work_experiences_insert_own"
  ON work_experiences FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "work_experiences_update_own"
  ON work_experiences FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "work_experiences_delete_own"
  ON work_experiences FOR DELETE
  USING (user_id = auth.uid());
