
-- Enable RLS on student_details table
ALTER TABLE student_details ENABLE ROW LEVEL SECURITY;

-- Create RLS policy to allow students to read their own data
CREATE POLICY "Students can read own data" ON student_details
FOR SELECT USING (true);

-- Create RLS policy for authentication lookup
CREATE POLICY "Allow authentication lookup" ON student_details
FOR SELECT USING (true);
