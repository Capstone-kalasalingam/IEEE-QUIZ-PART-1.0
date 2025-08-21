
-- Create table to store student quiz responses
CREATE TABLE public.quiz_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id BIGINT REFERENCES public.student_details(id) NOT NULL,
  exam_id UUID REFERENCES public.exams(id) NOT NULL,
  question_id UUID REFERENCES public.questions(id) NOT NULL,
  selected_option_id UUID REFERENCES public.options(id),
  is_correct BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table to store overall quiz results
CREATE TABLE public.quiz_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id BIGINT REFERENCES public.student_details(id) NOT NULL,
  exam_id UUID REFERENCES public.exams(id) NOT NULL,
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL DEFAULT 0,
  score_percentage DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  time_taken INTEGER, -- in seconds
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies for quiz_responses
ALTER TABLE public.quiz_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on quiz_responses" 
  ON public.quiz_responses 
  FOR ALL 
  USING (true);

-- Add RLS policies for quiz_results  
ALTER TABLE public.quiz_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on quiz_results" 
  ON public.quiz_results 
  FOR ALL 
  USING (true);

-- Create indexes for better performance
CREATE INDEX idx_quiz_responses_student_exam ON public.quiz_responses(student_id, exam_id);
CREATE INDEX idx_quiz_responses_question ON public.quiz_responses(question_id);
CREATE INDEX idx_quiz_results_student_exam ON public.quiz_results(student_id, exam_id);
