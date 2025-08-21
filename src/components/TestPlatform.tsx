import React, { useState, useEffect, useRef } from 'react';
import MobileRestriction from './MobileRestriction';
import FullscreenWarning from './FullscreenWarning';
import InternetWarning from './InternetWarning';
import DisqualifiedScreen from './DisqualifiedScreen';
import BlockedUserScreen from './BlockedUserScreen';
import TestInterface from './TestInterface';
import LoginPage from './LoginPage';
import { supabase } from '@/integrations/supabase/client';
import toast from 'react-hot-toast';
import { useViolationRecorder } from '@/hooks/useViolationRecorder';
import { useGlobalKeyboardBlocker } from '@/hooks/useGlobalKeyboardBlocker';
import { useCursorMonitoring } from '@/hooks/useCursorMonitoring';

const TestPlatform: React.FC = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showFullscreenWarning, setShowFullscreenWarning] = useState(false);
  const [showInternetWarning, setShowInternetWarning] = useState(false);
  const [isDisqualified, setIsDisqualified] = useState(false);
  const [disqualificationReason, setDisqualificationReason] = useState('');
  const [studentData, setStudentData] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const [violations, setViolations] = useState(0);

  // Track if we've already recorded a violation for the current non-fullscreen episode
  const hasRecordedForThisExitRef = useRef(false);
  // Track if user just logged in to give grace period for fullscreen
  const loginGracePeriodRef = useRef(false);

  // Setup a dedicated recorder to use when the warning screen appears
  const { recordViolation } = useViolationRecorder({
    studentData,
    onBlocked: () => {
      setIsBlocked(true);
      setShowFullscreenWarning(false);
    }
  });

  useEffect(() => {
    const checkExistingSession = () => {
      try {
        const savedStudentData = localStorage.getItem('student_session');
        const savedSessionTime = localStorage.getItem('session_start_time');
        
        if (savedStudentData) {
          const parsedData = JSON.parse(savedStudentData);
          console.log('Found existing session:', parsedData);
          setStudentData(parsedData);
          setIsAuthenticated(true);
          setIsFirstLogin(false); // Not first login if session exists
          setViolations(parsedData.fullscreen_violations || 0);
          
          // Restore session start time
          if (savedSessionTime) {
            setSessionStartTime(new Date(savedSessionTime));
          }
          
          fetchStudentStatus(parsedData.id);
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error checking existing session:', error);
        localStorage.removeItem('student_session');
        localStorage.removeItem('session_start_time');
        setIsLoading(false);
      }
    };

    checkExistingSession();
  }, []);

  // Strict fullscreen enforcement with grace period for fresh login
  useEffect(() => {
    const enforceFullscreen = () => {
      if (isAuthenticated && !isBlocked) {
        if (!document.fullscreenElement) {
          // Give 3 seconds grace period after fresh login
          if (loginGracePeriodRef.current) {
            console.log('Grace period active - not showing warning yet');
            return;
          }
          setShowFullscreenWarning(true);
        } else {
          setShowFullscreenWarning(false);
        }
      }
    };

    // Check immediately
    enforceFullscreen();

    // Set up interval to check every 100ms for strict enforcement
    const interval = setInterval(() => {
      enforceFullscreen();
    }, 100);

    return () => clearInterval(interval);
  }, [isAuthenticated, isBlocked]);

  const fetchStudentStatus = async (studentId: number) => {
    try {
      const { data, error } = await supabase
        .from('student_details')
        .select('*')
        .eq('id', studentId)
        .single();

      if (error) {
        console.error('Error fetching student status:', error);
        localStorage.removeItem('student_session');
        localStorage.removeItem('session_start_time');
        setIsAuthenticated(false);
        setStudentData(null);
        setIsLoading(false);
        return;
      }

      console.log('Current student status:', data);
      
      // Check if student was just unblocked (violations reset to 0)
      const wasBlocked = studentData?.status === 'blocked';
      const isNowActive = data.status === 'active';
      const violationsReset = data.fullscreen_violations === 0;
      
      setStudentData(data);
      setViolations(data.fullscreen_violations || 0);
      setIsBlocked(data.status === 'blocked');
      
      // Auto-enter fullscreen when student is unblocked
      if (wasBlocked && isNowActive && violationsReset) {
        console.log('Student was unblocked - attempting to enter fullscreen');
        setTimeout(() => {
          document.documentElement.requestFullscreen?.().then(() => {
            console.log('Auto-entered fullscreen after unblock');
            toast.success('You have been unblocked! Entered fullscreen mode.', {
              duration: 3000,
              position: 'top-center',
              style: {
                background: '#dcfce7',
                color: '#166534',
                border: '1px solid #bbf7d0',
                fontWeight: '500',
              },
            });
          }).catch((err) => {
            console.log('Auto-fullscreen failed after unblock:', err);
            toast('You have been unblocked! Please enter fullscreen mode manually.', {
              duration: 4000,
              position: 'top-center',
            });
          });
        }, 1000);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Unexpected error fetching student status:', error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsMobile(/Mobi|Android/i.test(navigator.userAgent));

    const handleFullscreenChange = () => {
      const isInFullscreen = !!document.fullscreenElement;
      setIsFullscreen(isInFullscreen);

      // Reset the per-exit guard when returning to fullscreen
      if (isInFullscreen) {
        hasRecordedForThisExitRef.current = false;
      }

      console.log('Fullscreen change:', { isInFullscreen, isAuthenticated, isBlocked });
    };

    // Handle keyboard shortcuts that might exit fullscreen
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isAuthenticated && !isBlocked) {
        // Detect Escape key (exits fullscreen) - we'll let it exit but immediately show warning
        if (event.key === 'Escape' && document.fullscreenElement) {
          console.log('Escape key pressed in fullscreen - will show warning after exit');
        }
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('keydown', handleKeyDown);

    const handleOnlineStatus = () => {
      setIsOnline(navigator.onLine);
      setShowInternetWarning(!navigator.onLine);
    };

    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
    };
  }, [isAuthenticated, isBlocked]);

  useEffect(() => {
    if (!isAuthenticated || !studentData?.id) return;

    console.log('Setting up real-time monitoring for student:', studentData.id);

    const channel = supabase
      .channel('student-status-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'student_details',
          filter: `id=eq.${studentData.id}`
        },
        (payload) => {
          console.log('Student status update received:', payload);
          const newData = payload.new;
          
          // Check if student was just unblocked
          const wasBlocked = studentData.status === 'blocked';
          const isNowActive = newData.status === 'active';
          const violationsReset = newData.fullscreen_violations === 0;
          
          setStudentData(newData);
          setViolations(newData.fullscreen_violations || 0);
          
          if (newData.status === 'blocked') {
            console.log('Student has been blocked');
            setIsBlocked(true);
            setShowFullscreenWarning(false);
          } else if (isNowActive) {
            console.log('Student has been unblocked - violations reset to 0');
            setIsBlocked(false);
            setViolations(0);
            
            // Auto-enter fullscreen when unblocked
            if (wasBlocked && violationsReset) {
              setTimeout(() => {
                document.documentElement.requestFullscreen?.().then(() => {
                  console.log('Auto-entered fullscreen after real-time unblock');
                  toast.success('You have been unblocked! Entered fullscreen mode.', {
                    duration: 3000,
                    position: 'top-center',
                    style: {
                      background: '#dcfce7',
                      color: '#166534',
                      border: '1px solid #bbf7d0',
                      fontWeight: '500',
                    },
                  });
                }).catch((err) => {
                  console.log('Auto-fullscreen failed after real-time unblock:', err);
                  toast('You have been unblocked! Please enter fullscreen mode manually.', {
                    duration: 4000,
                    position: 'top-center',
                  });
                });
              }, 1000);
            }
          }
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [isAuthenticated, studentData?.id, studentData?.status]);

  const handleLogin = (data: any) => {
    console.log('User logged in:', data);
    const loginTime = new Date();
    
    setStudentData(data);
    setIsAuthenticated(true);
    setSessionStartTime(loginTime);
    setIsFirstLogin(true);
    setViolations(data.fullscreen_violations || 0);
    loginGracePeriodRef.current = true; // Start grace period
    
    // Save session and start time to localStorage
    localStorage.setItem('student_session', JSON.stringify(data));
    localStorage.setItem('session_start_time', loginTime.toISOString());
    
    // Clear grace period after 3 seconds
    setTimeout(() => {
      loginGracePeriodRef.current = false;
      console.log('Grace period ended');
    }, 3000);
    
    // Attempt to enter fullscreen immediately on login
    document.documentElement.requestFullscreen?.().catch((err) => {
      console.log('Fullscreen request failed on login:', err);
    });
    
    if (data.status === 'blocked') {
      setIsBlocked(true);
    }
  };

  const handleDisqualify = (reason: string) => {
    setDisqualificationReason(reason);
    setIsDisqualified(true);
  };

  const handleFullscreenTimeExpired = () => {
    handleDisqualify('Exited fullscreen for too long');
  };

  const handleFullscreenRestored = () => {
    console.log('Fullscreen restored');
    setShowFullscreenWarning(false);
    setIsFullscreen(true);
  };

  const handleInternetTimeExpired = async () => {
    if (studentData && studentData.id) {
      try {
        console.log('Blocking student due to internet timeout:', studentData.id);
        
        const { error } = await supabase
          .from('student_details')
          .update({ status: 'blocked' })
          .eq('id', studentData.id);

        if (error) {
          console.error('Error blocking student:', error);
        } else {
          console.log('Student blocked successfully due to internet timeout');
        }
      } catch (error) {
        console.error('Unexpected error blocking student:', error);
      }
    }
    
    handleDisqualify('Internet disconnected for too long');
  };

  const handleInternetRestored = () => {
    setShowInternetWarning(false);
    setIsOnline(true);
  };

  // When the warning screen becomes visible, record a violation once per episode
  // Skip violation for the very first warning right after login (better UX)
  useEffect(() => {
    if (!showFullscreenWarning) return;
    if (!isAuthenticated || isBlocked) return;

    // Skip violation for the very first warning right after login
    if (isFirstLogin) {
      console.log('First login - showing warning without recording a violation (better UX)');
      setIsFirstLogin(false); // subsequent warnings will count
      return;
    }

    if (!hasRecordedForThisExitRef.current) {
      console.log('Recording violation for non-fullscreen state (warning shown)');
      hasRecordedForThisExitRef.current = true;
      recordViolation();
    }
  }, [showFullscreenWarning, isAuthenticated, isBlocked, isFirstLogin, recordViolation]);

  // Block all keyboard input during the exam session and record violations in real-time
  useGlobalKeyboardBlocker({
    isEnabled: isAuthenticated && !isBlocked,
    onViolation: recordViolation
  });

  // Add cursor monitoring - only active during exam and when user is not blocked
  useCursorMonitoring({
    isEnabled: isAuthenticated && !isBlocked && !showFullscreenWarning && !showInternetWarning,
    onViolation: recordViolation
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ieee-light-blue via-white to-ieee-light-blue flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ieee-navy"></div>
        <span className="ml-2 text-ieee-gray">Checking session...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  if (isBlocked) {
    return <BlockedUserScreen studentData={studentData} />;
  }

  if (isMobile) {
    return <MobileRestriction />;
  }

  if (isDisqualified) {
    return <DisqualifiedScreen reason={disqualificationReason} />;
  }

  if (showFullscreenWarning) {
    return (
      <FullscreenWarning
        onTimeExpired={handleFullscreenTimeExpired}
        onRestored={handleFullscreenRestored}
        studentData={studentData}
      />
    );
  }

  if (showInternetWarning) {
    return (
      <InternetWarning
        onTimeExpired={handleInternetTimeExpired}
        onRestored={handleInternetRestored}
        studentData={studentData}
      />
    );
  }

  return (
    <TestInterface 
      studentData={studentData} 
      onDisqualify={handleDisqualify} 
      sessionStartTime={sessionStartTime}
      currentViolations={violations}
    />
  );
};

export default TestPlatform;
