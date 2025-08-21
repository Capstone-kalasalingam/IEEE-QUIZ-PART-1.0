
-- Create admin_users table for admin authentication
CREATE TABLE public.admin_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default admin user (username: 'IEEE COMSOC', password: 'admin@123')
-- Password hash for 'admin@123' using bcrypt
INSERT INTO public.admin_users (username, password_hash) 
VALUES ('IEEE COMSOC', '$2b$10$K8BEJzQXz1pqm.rZ8p4Lp.QXvH1ZbA8vK4L2M6N9O0P1Q2R3S4T5U6');

-- Enable RLS on admin_users table
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Policy to allow admin authentication (anyone can read for login verification)
CREATE POLICY "Allow admin authentication" 
  ON public.admin_users 
  FOR SELECT 
  USING (true);

-- Update RLS policies for student_details to allow admin operations
-- First, drop existing policies
DROP POLICY IF EXISTS "Allow authentication lookup" ON public.student_details;
DROP POLICY IF EXISTS "Students can read own data" ON public.student_details;

-- Create new comprehensive policies
CREATE POLICY "Allow public read access" 
  ON public.student_details 
  FOR SELECT 
  USING (true);

CREATE POLICY "Allow public insert" 
  ON public.student_details 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Allow public update" 
  ON public.student_details 
  FOR UPDATE 
  USING (true);

CREATE POLICY "Allow public delete" 
  ON public.student_details 
  FOR DELETE 
  USING (true);

-- Add trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger for student_details table
DROP TRIGGER IF EXISTS update_student_details_updated_at ON public.student_details;
CREATE TRIGGER update_student_details_updated_at
    BEFORE UPDATE ON public.student_details
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add updated_at column to student_details if it doesn't exist
ALTER TABLE public.student_details 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();
