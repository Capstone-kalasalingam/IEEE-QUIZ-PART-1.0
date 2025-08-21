
import { useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import toast from 'react-hot-toast';

interface UseViolationRecorderProps {
  studentData: any;
  onBlocked: () => void;
}

/**
 * Minimal, focused hook to record a fullscreen violation.
 * Safe to call from places outside the exam UI (e.g., when warning appears).
 */
export const useViolationRecorder = ({ studentData, onBlocked }: UseViolationRecorderProps) => {
  const isRecordingRef = useRef(false);
  const lastViolationTimeRef = useRef(0);

  const recordViolation = async () => {
    if (!studentData?.id || isRecordingRef.current) return;

    const now = Date.now();
    if (now - lastViolationTimeRef.current < 1000) return; // debounce

    isRecordingRef.current = true;
    lastViolationTimeRef.current = now;

    try {
      const { data: currentData, error: fetchError } = await supabase
        .from('student_details')
        .select('fullscreen_violations')
        .eq('id', studentData.id)
        .single();

      if (fetchError) {
        console.error('Error fetching current violations:', fetchError);
        isRecordingRef.current = false;
        return;
      }

      const currentViolations = currentData?.fullscreen_violations || 0;
      const newViolations = currentViolations + 1;

      const updateData: any = { fullscreen_violations: newViolations };
      if (newViolations >= 5) {
        updateData.status = 'blocked';
      }

      const { error: updateError } = await supabase
        .from('student_details')
        .update(updateData)
        .eq('id', studentData.id);

      if (updateError) {
        console.error('Error updating violations:', updateError);
        isRecordingRef.current = false;
        return;
      }

      if (newViolations >= 5) {
        toast.error("Account Blocked! You have been blocked due to 5 fullscreen violations.", {
          duration: 6000,
          position: 'top-center',
          style: {
            background: '#fee2e2',
            color: '#991b1b',
            border: '1px solid #fecaca',
            fontWeight: '600',
          },
        });
        onBlocked();
      } else {
        toast.error(`Fullscreen Violation Warning ${newViolations}/5: Stay in fullscreen mode!`, {
          duration: 4000,
          position: 'top-center',
          style: {
            background: '#fef3c7',
            color: '#92400e',
            border: '1px solid #fde68a',
            fontWeight: '500',
          },
        });
      }

      console.log(`Fullscreen violation recorded (external): ${newViolations}/5`);
    } catch (error) {
      console.error('Error recording violation (external):', error);
    } finally {
      isRecordingRef.current = false;
    }
  };

  return { recordViolation };
};
