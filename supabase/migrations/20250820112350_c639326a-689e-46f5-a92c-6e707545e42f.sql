
-- Add status column to student_details table for blocking functionality
ALTER TABLE public.student_details 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'blocked', 'pending'));

-- Enable realtime for student_details table
ALTER TABLE public.student_details REPLICA IDENTITY FULL;

-- Add table to realtime publication (if not already added)
ALTER PUBLICATION supabase_realtime ADD TABLE public.student_details;
