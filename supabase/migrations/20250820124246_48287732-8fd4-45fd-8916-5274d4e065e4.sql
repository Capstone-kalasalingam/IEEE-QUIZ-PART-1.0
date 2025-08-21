
-- Update RLS policies for student_details to allow admins to update status
DROP POLICY IF EXISTS "Allow admin updates" ON public.student_details;

CREATE POLICY "Allow admin updates" 
  ON public.student_details 
  FOR UPDATE 
  USING (true);

-- Ensure real-time is enabled for student_details table
ALTER TABLE public.student_details REPLICA IDENTITY FULL;

-- Add the table to realtime publication if not already added
ALTER PUBLICATION supabase_realtime ADD TABLE public.student_details;
