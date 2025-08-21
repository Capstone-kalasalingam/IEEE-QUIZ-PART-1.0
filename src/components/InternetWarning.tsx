
import React, { useState, useEffect } from 'react';
import { WifiOff, AlertTriangle, Clock, Wifi } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import toast from 'react-hot-toast';

interface InternetWarningProps {
  onTimeExpired: () => void;
  onRestored: () => void;
  studentData?: any;
}

const InternetWarning: React.FC<InternetWarningProps> = ({ onTimeExpired, onRestored, studentData }) => {
  const [timeLeft, setTimeLeft] = useState(45);

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

    // Check if internet is restored
    const checkConnection = () => {
      if (navigator.onLine) {
        clearInterval(timer);
        toast.success("Internet connection restored! Continuing test...", {
          duration: 3000,
          position: 'top-center',
          style: {
            background: '#dcfce7',
            color: '#166534',
            border: '1px solid #bbf7d0',
            fontWeight: '500',
          },
        });
        onRestored();
      }
    };

    window.addEventListener('online', checkConnection);
    const interval = setInterval(checkConnection, 1000);

    return () => {
      clearInterval(timer);
      clearInterval(interval);
      window.removeEventListener('online', checkConnection);
    };
  }, [onTimeExpired, onRestored]);

  const handleTimeExpired = async () => {
    // Block the user in the database
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
          toast.error("Test terminated! You have been blocked due to internet timeout.", {
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

  const retryConnection = async () => {
    try {
      // Attempt to fetch a small resource to test connectivity
      await fetch('/favicon.ico', { method: 'HEAD', cache: 'no-cache' });
      if (navigator.onLine) {
        toast.success("Connection restored successfully!", {
          duration: 3000,
          position: 'top-center',
          style: {
            background: '#dcfce7',
            color: '#166534',
            border: '1px solid #bbf7d0',
            fontWeight: '500',
          },
        });
        onRestored();
      }
    } catch (error) {
      toast.error("Still offline. Please check your connection.", {
        duration: 2000,
        position: 'top-center',
        style: {
          background: '#fef3c7',
          color: '#92400e',
          border: '1px solid #fde68a',
          fontWeight: '500',
        },
      });
      console.log('Still offline');
    }
  };

  return (
    <div className="fullscreen-overlay">
      <div className="bg-white rounded-2xl p-8 max-w-md mx-4 text-center shadow-2xl animate-fade-in">
        <div className="flex justify-center mb-4">
          <div className="relative">
            <WifiOff className="h-16 w-16 text-destructive" />
            <AlertTriangle className="h-6 w-6 text-status-warning absolute -top-1 -right-1 animate-pulse" />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-ieee-navy mb-2">
          🌐 No Internet Connection
        </h2>
        
        <p className="text-ieee-gray mb-6">
          Your internet connection has been lost. Please reconnect to continue the test.
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
            Test will be terminated if connection is not restored
          </p>
        </div>
        
        <Button 
          onClick={retryConnection}
          className="btn-ieee-primary w-full mb-3"
        >
          <Wifi className="h-4 w-4 mr-2" />
          Check Connection
        </Button>
        
        <div className="space-y-2 text-xs text-ieee-gray">
          <p>• Check your WiFi or ethernet connection</p>
          <p>• Ensure your internet provider is working</p>
          <p>• Try refreshing your network connection</p>
        </div>
      </div>
    </div>
  );
};

export default InternetWarning;
