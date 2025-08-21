
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseExamPersistenceProps {
  studentData: any;
  examId: string;
  initialTimeRemaining: number;
}

export const useExamPersistence = ({ studentData, examId, initialTimeRemaining }: UseExamPersistenceProps) => {
  const [timeRemaining, setTimeRemaining] = useState(initialTimeRemaining);

  // Load persisted time when component mounts or when student is unblocked
  useEffect(() => {
    if (studentData?.current_exam_id === examId && studentData?.last_exam_time_remaining) {
      console.log('Resuming exam with remaining time:', studentData.last_exam_time_remaining);
      setTimeRemaining(studentData.last_exam_time_remaining);
    } else if (studentData?.current_exam_id !== examId && examId) {
      // New exam started, reset to initial time
      console.log('Starting new exam with initial time:', initialTimeRemaining);
      setTimeRemaining(initialTimeRemaining);
    }
  }, [studentData, examId, initialTimeRemaining]);

  // Save time to database every 10 seconds, but pause when blocked
  useEffect(() => {
    if (!studentData?.id || !examId || studentData?.status === 'blocked') return;

    const saveInterval = setInterval(async () => {
      try {
        console.log('Saving exam progress. Time remaining:', timeRemaining);
        await supabase
          .from('student_details')
          .update({
            current_exam_id: examId,
            last_exam_time_remaining: timeRemaining
          })
          .eq('id', studentData.id);
      } catch (error) {
        console.error('Error saving exam progress:', error);
      }
    }, 10000); // Save every 10 seconds

    return () => clearInterval(saveInterval);
  }, [studentData?.id, studentData?.status, examId, timeRemaining]);

  return { timeRemaining, setTimeRemaining };
};
