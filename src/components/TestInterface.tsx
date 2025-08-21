import React, { useState, useEffect } from 'react';
import { Shield, Clock, Eye, Globe, Wifi, WifiOff, Monitor, AlertCircle, Timer } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import QuizInterface from './QuizInterface';
import Footer from './Footer';
import { supabase } from '@/integrations/supabase/client';

interface TestInterfaceProps {
  studentData?: any;
  onDisqualify: (reason: string) => void;
  sessionStartTime?: Date | null;
  currentViolations?: number;
}

const TestInterface: React.FC<TestInterfaceProps> = ({ 
  studentData, 
  onDisqualify, 
  sessionStartTime,
  currentViolations = 0 
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [signalStrength, setSignalStrength] = useState(0);
  const [signalStatus, setSignalStatus] = useState<'excellent' | 'good' | 'fair' | 'poor'>('excellent');
  const [violations, setViolations] = useState(currentViolations);

  useEffect(() => {
    setViolations(currentViolations);
  }, [currentViolations]);

  useEffect(() => {
    if (!studentData?.id) return;

    const channel = supabase
      .channel(`student-violations-${studentData.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'student_details',
          filter: `id=eq.${studentData.id}`
        },
        (payload) => {
          console.log('Violation update received in TestInterface:', payload);
          const newData = payload.new;
          if (newData.fullscreen_violations !== undefined) {
            setViolations(newData.fullscreen_violations);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [studentData?.id]);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  React.useEffect(() => {
    const measureSignal = async () => {
      const start = performance.now();
      try {
        await fetch('/favicon.ico', { method: 'HEAD', cache: 'no-cache' });
        const end = performance.now();
        const latency = end - start;
        
        setSignalStrength(Math.round(latency));
        
        if (latency < 100) {
          setSignalStatus('excellent');
        } else if (latency < 300) {
          setSignalStatus('good');
        } else if (latency < 600) {
          setSignalStatus('fair');
        } else {
          setSignalStatus('poor');
        }
      } catch (error) {
        setSignalStrength(999);
        setSignalStatus('poor');
      }
    };

    measureSignal();
    const interval = setInterval(measureSignal, 2000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getSignalColor = () => {
    switch (signalStatus) {
      case 'excellent': return 'text-status-active';
      case 'good': return 'text-status-pending';
      case 'fair': return 'text-status-warning';
      case 'poor': return 'text-status-blocked';
      default: return 'text-ieee-gray';
    }
  };

  const getViolationColor = () => {
    if (violations === 0) return 'text-status-active';
    if (violations <= 2) return 'text-status-warning';
    if (violations <= 4) return 'text-status-blocked';
    return 'text-red-700';
  };

  const calculateSessionDuration = () => {
    if (!sessionStartTime) return '00:00:00';
    
    const now = new Date();
    const diffMs = now.getTime() - sessionStartTime.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-ieee-light-blue via-white to-ieee-light-blue font-poppins flex flex-col">
      <div className="bg-white/95 backdrop-blur-sm border-b border-ieee-navy/10 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-ieee-navy to-ieee-blue rounded-xl flex items-center justify-center">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-ieee-navy">IEEE COMSOC KARE</h1>
                  <p className="text-xs text-ieee-gray">Quantum Communications Quiz</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-6">
              <div className="text-right">
                <p className="text-sm font-semibold text-ieee-navy">{studentData.name}</p>
                <p className="text-xs text-ieee-gray">Reg: {studentData.registration_no}</p>
              </div>

              <div className="flex items-center space-x-2">
                <Timer className="h-4 w-4 text-ieee-blue" />
                <span className="text-xs font-medium text-ieee-navy">
                  Session: {calculateSessionDuration()}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <AlertCircle className={`h-4 w-4 ${getViolationColor()}`} />
                <span className={`text-xs font-medium ${getViolationColor()}`}>
                  Violations: {violations}/5
                </span>
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-status-active rounded-full animate-pulse"></div>
                  <span className="text-xs text-ieee-gray">Secure Session</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Monitor className="h-4 w-4 text-status-active" />
                  <span className="text-xs text-ieee-gray">Protected</span>
                </div>
                <div className="flex items-center space-x-2">
                  {navigator.onLine ? (
                    <Wifi className={`h-4 w-4 ${getSignalColor()}`} />
                  ) : (
                    <WifiOff className="h-4 w-4 text-status-blocked" />
                  )}
                  <span className={`text-xs ${getSignalColor()}`}>
                    {navigator.onLine ? `${signalStrength}ms` : 'Offline'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1">
        <QuizInterface studentData={studentData} sessionStartTime={sessionStartTime} />
      </div>
      
      <Footer />
    </div>
  );
};

export default TestInterface;
