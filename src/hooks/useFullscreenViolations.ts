
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import toast from 'react-hot-toast';
import { useKeyboardMonitoring } from './useKeyboardMonitoring';

interface UseFullscreenViolationsProps {
  studentData: any;
  onBlocked: () => void;
}

export const useFullscreenViolations = ({ studentData, onBlocked }: UseFullscreenViolationsProps) => {
  const [violations, setViolations] = useState(0);
  const isRecordingRef = useRef(false);
  const lastViolationTimeRef = useRef(0);

  // Enable keyboard monitoring only when user is active and has exam
  const isKeyboardMonitoringEnabled = studentData?.status === 'active' && 
                                     studentData?.current_exam_id && 
                                     violations < 5;

  useEffect(() => {
    // Reset violations to 0 when user is unblocked or first loads
    if (studentData?.status === 'active') {
      console.log('User is active/unblocked - resetting violations to 0');
      setViolations(0);
      
      // Reset violations in database to 0 when unblocked
      if (studentData?.id && studentData?.fullscreen_violations > 0) {
        const resetViolations = async () => {
          try {
            await supabase
              .from('student_details')
              .update({ fullscreen_violations: 0 })
              .eq('id', studentData.id);
            console.log('Violations reset to 0 in database');
          } catch (error) {
            console.error('Error resetting violations:', error);
          }
        };
        resetViolations();
      }
    } else {
      // Load existing violations if user is not active/unblocked
      const currentViolations = studentData?.fullscreen_violations || 0;
      setViolations(currentViolations);
      console.log('Loaded existing violations:', currentViolations);
    }
  }, [studentData?.status, studentData?.id]);

  // Check for split screen by comparing window dimensions with screen dimensions
  const isSplitScreen = () => {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const screenWidth = window.screen.width;
    const screenHeight = window.screen.height;
    
    // Consider it split screen if window is significantly smaller than screen
    const widthRatio = windowWidth / screenWidth;
    const heightRatio = windowHeight / screenHeight;
    
    console.log('Split screen check:', { 
      windowWidth, 
      windowHeight, 
      screenWidth, 
      screenHeight, 
      widthRatio, 
      heightRatio,
      isSplit: widthRatio < 0.9 || heightRatio < 0.9
    });
    
    return widthRatio < 0.9 || heightRatio < 0.9;
  };

  const recordViolation = async () => {
    if (!studentData?.id || isRecordingRef.current) return;

    const now = Date.now();
    if (now - lastViolationTimeRef.current < 1000) {
      console.log('Skipping violation - too soon after last one');
      return;
    }

    if (violations >= 5) {
      console.log('Already at maximum violations (5) - triggering block');
      onBlocked();
      return;
    }

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

      console.log(`Recording violation: ${currentViolations} -> ${newViolations}`);

      const updateData: any = {
        fullscreen_violations: newViolations
      };

      if (newViolations >= 5) {
        updateData.status = 'blocked';
        console.log('User will be blocked - reached 5 violations');
      }

      const { error } = await supabase
        .from('student_details')
        .update(updateData)
        .eq('id', studentData.id);

      if (error) {
        console.error('Error updating violations:', error);
        isRecordingRef.current = false;
        return;
      }

      setViolations(newViolations);

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

      console.log(`Fullscreen violation recorded: ${newViolations}/5`);
    } catch (error) {
      console.error('Error recording violation:', error);
    } finally {
      isRecordingRef.current = false;
    }
  };

  // Use the keyboard monitoring hook
  useKeyboardMonitoring({
    studentData,
    onViolation: recordViolation,
    isEnabled: isKeyboardMonitoringEnabled
  });

  // Monitor for split screen changes with debouncing
  useEffect(() => {
    if (!studentData?.id || violations >= 5) return;

    let timeoutId: NodeJS.Timeout;

    const checkSplitScreen = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(() => {
        if (document.fullscreenElement && isSplitScreen()) {
          console.log('Split screen detected while in fullscreen - recording violation');
          recordViolation();
        }
      }, 1500);
    };

    const handleResize = () => {
      checkSplitScreen();
    };

    const handleFullscreenChange = () => {
      setTimeout(() => {
        if (document.fullscreenElement && isSplitScreen()) {
          console.log('Split screen detected after fullscreen change');
          recordViolation();
        }
      }, 500);
    };

    window.addEventListener('resize', handleResize);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [violations, studentData?.id]);

  return { violations, recordViolation };
};
