
import { useEffect, useRef } from 'react';

interface UseCursorMonitoringProps {
  isEnabled: boolean;
  onViolation: () => void;
}

export const useCursorMonitoring = ({ isEnabled, onViolation }: UseCursorMonitoringProps) => {
  const cursorInWindowRef = useRef(true);
  const violationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastViolationTimeRef = useRef(0);

  useEffect(() => {
    if (!isEnabled) return;

    const handleMouseEnter = () => {
      cursorInWindowRef.current = true;
      
      // Clear any pending violation timeout when cursor returns
      if (violationTimeoutRef.current) {
        clearTimeout(violationTimeoutRef.current);
        violationTimeoutRef.current = null;
      }
      
      console.log('Cursor entered exam window');
    };

    const handleMouseLeave = () => {
      cursorInWindowRef.current = false;
      console.log('Cursor left exam window - starting violation timer');
      
      // Start a 3-second timer before recording violation
      violationTimeoutRef.current = setTimeout(() => {
        const now = Date.now();
        
        // Debounce violations (don't record more than once per 5 seconds)
        if (now - lastViolationTimeRef.current < 5000) {
          console.log('Cursor violation debounced - too recent');
          return;
        }
        
        if (!cursorInWindowRef.current) {
          console.log('Cursor violation detected - cursor left exam window for 3+ seconds');
          lastViolationTimeRef.current = now;
          onViolation();
        }
      }, 3000); // 3 second delay before violation
    };

    // Add event listeners to the document body to detect cursor leaving the window
    document.body.addEventListener('mouseenter', handleMouseEnter);
    document.body.addEventListener('mouseleave', handleMouseLeave);

    // Also listen for cursor leaving the entire window
    const handleWindowMouseOut = (e: MouseEvent) => {
      // Check if cursor actually left the window (not just moved to a child element)
      if (!e.relatedTarget && !document.contains(e.relatedTarget as Node)) {
        handleMouseLeave();
      }
    };

    document.addEventListener('mouseout', handleWindowMouseOut);

    return () => {
      document.body.removeEventListener('mouseenter', handleMouseEnter);
      document.body.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseout', handleWindowMouseOut);
      
      if (violationTimeoutRef.current) {
        clearTimeout(violationTimeoutRef.current);
      }
    };
  }, [isEnabled, onViolation]);
};
