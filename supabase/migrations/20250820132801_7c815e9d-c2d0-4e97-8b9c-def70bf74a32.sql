
-- Add columns to student_details table to track fullscreen violations
ALTER TABLE public.student_details 
ADD COLUMN IF NOT EXISTS fullscreen_violations INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_exam_time_remaining INTEGER,
ADD COLUMN IF NOT EXISTS current_exam_id UUID;

-- Add index for better performance on exam queries
CREATE INDEX IF NOT EXISTS idx_student_details_exam_id ON public.student_details(current_exam_id);
CREATE INDEX IF NOT EXISTS idx_student_details_violations ON public.student_details(fullscreen_violations);
