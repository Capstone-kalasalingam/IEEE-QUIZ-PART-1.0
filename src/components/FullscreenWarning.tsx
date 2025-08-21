
import React, { useState, useEffect } from 'react';
import { Maximize, AlertTriangle, Clock, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import toast from 'react-hot-toast';

interface FullscreenWarningProps {
  onTimeExpired: () => void;
  onRestored: () => void;
  studentData?: any;
}

const FullscreenWarning: React.FC<FullscreenWarningProps> = ({ onTimeExpired, onRestored, studentData }) => {
  const [timeLeft, setTimeLeft] = useState(45); // Changed to 45 seconds

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleTimeExpired();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Check if fullscreen is restored
    const checkFullscreen = () => {
      if (document.fullscreenElement) {
        clearInterval(timer);
        onRestored();
      }
    };

    document.addEventListener('fullscreenchange', checkFullscreen);
    const interval = setInterval(checkFullscreen, 1000);

    return () => {
      clearInterval(timer);
      clearInterval(interval);
      document.removeEventListener('fullscreenchange', checkFullscreen);
    };
  }, [onTimeExpired, onRestored]);

  const handleTimeExpired = async () => {
    // Additional blocking logic when timer expires
    if (studentData && studentData.id) {
      try {
        console.log('Blocking student due to fullscreen timeout:', studentData.id);
        
        const { error } = await supabase
          .from('student_details')
          .update({ status: 'blocked' })
          .eq('id', studentData.id);

        if (error) {
          console.error('Error blocking student:', error);
        } else {
          console.log('Student blocked successfully due to fullscreen timeout');
          toast.error("Test terminated! You have been blocked due to timeout.", {
            duration: 6000,
            position: 'top-center',
            style: {
              background: '#fee2e2',
              color: '#991b1b',
              border: '1px solid #fecaca',
              fontWeight: '600',
            },
          });
        }
      } catch (error) {
        console.error('Unexpected error blocking student:', error);
      }
    }
    
    onTimeExpired();
  };

  const enterFullscreen = () => {
    document.documentElement.requestFullscreen?.();
  };

  return (
    <div className="fullscreen-overlay">
      <div className="bg-white rounded-2xl p-8 max-w-md mx-4 text-center shadow-2xl animate-fade-in">
        <div className="flex justify-center mb-4">
          <div className="relative">
            <Maximize className="h-16 w-16 text-destructive" />
            <AlertTriangle className="h-6 w-6 text-status-warning absolute -top-1 -right-1 animate-pulse" />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-ieee-navy mb-2">
          📱 Fullscreen Required
        </h2>
        
        <p className="text-ieee-gray mb-6">
          You must stay in fullscreen mode during the test. Please return to fullscreen immediately.
        </p>
        
        <div className="bg-destructive/10 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-center mb-2">
            <Clock className="h-5 w-5 text-destructive mr-2" />
            <span className="font-semibold text-destructive">Time Remaining</span>
          </div>
          <div className="text-3xl font-bold text-destructive countdown-animation">
            {timeLeft}s
          </div>
          <p className="text-xs text-ieee-gray mt-2">
            Test will be terminated if fullscreen is not restored
          </p>
        </div>
        
        <Button 
          onClick={enterFullscreen}
          className="btn-ieee-primary w-full mb-3"
        >
          <Monitor className="h-4 w-4 mr-2" />
          Return to Fullscreen
        </Button>
        
        <div className="space-y-2 text-xs text-ieee-gray">
          <p>• Press F11 or use the button above</p>
          <p>• Do not minimize or switch windows</p>
          <p>• Stay focused on the test interface</p>
          <p>• Avoid split screen mode</p>
          <p className="font-semibold text-destructive">• Maximum 5 violations allowed</p>
        </div>
      </div>
    </div>
  );
};

export default FullscreenWarning;
