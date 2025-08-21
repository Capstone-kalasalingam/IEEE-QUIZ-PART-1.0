
import { useEffect, useRef } from 'react';

/**
 * Blocks nearly all keyboard input when enabled and records a violation
 * at most once per second while keys are being pressed.
 * We allow F11 so users can quickly re-enter fullscreen.
 * Also detects mouse gestures for tab switching.
 */
interface UseGlobalKeyboardBlockerProps {
  isEnabled: boolean;
  onViolation: () => void;
}

export const useGlobalKeyboardBlocker = ({ isEnabled, onViolation }: UseGlobalKeyboardBlockerProps) => {
  const lastViolationRef = useRef(0);

  useEffect(() => {
    if (!isEnabled) return;

    const triggerViolationThrottled = () => {
      const now = Date.now();
      if (now - lastViolationRef.current >= 1000) {
        lastViolationRef.current = now;
        onViolation();
      }
    };

    const handleKeyEvent = (event: KeyboardEvent) => {
      // Allow F11 so the user can return to fullscreen
      if (event.key === 'F11') return;

      // Best-effort detection for screenshots (PrintScreen and common combos)
      const isPrintScreen = event.key === 'PrintScreen';
      const isMacScreenshot =
        (event.metaKey && event.shiftKey && (event.key === '3' || event.key === '4' || event.key === '5'));
      // Windows+Shift+S generally doesn't reach the page; still block S with shift if it ever does
      const isWinSnipBestEffort = event.shiftKey && (event.key?.toLowerCase?.() === 's');

      // Block everything during exam; mark likely screenshot attempts specially
      if (isPrintScreen || isMacScreenshot || isWinSnipBestEffort || true) {
        event.preventDefault();
        event.stopPropagation();
        triggerViolationThrottled();
        return false;
      }
    };

    // Mouse gesture detection for tab switching
    const handleMouseDown = (event: MouseEvent) => {
      // Detect middle mouse button (button 1) which is commonly used for tab switching
      if (event.button === 1) {
        event.preventDefault();
        event.stopPropagation();
        triggerViolationThrottled();
        return false;
      }
      
      // Detect mouse button 3 and 4 (back/forward buttons) which can be used for navigation
      if (event.button === 3 || event.button === 4) {
        event.preventDefault();
        event.stopPropagation();
        triggerViolationThrottled();
        return false;
      }
    };

    const handleContextMenu = (event: MouseEvent) => {
      // Block right-click context menu
      event.preventDefault();
      event.stopPropagation();
      triggerViolationThrottled();
      return false;
    };

    // Capture phase to run before other handlers; passive must be false to be able to preventDefault
    document.addEventListener('keydown', handleKeyEvent, { capture: true, passive: false });
    document.addEventListener('keyup', handleKeyEvent, { capture: true, passive: false });
    document.addEventListener('mousedown', handleMouseDown, { capture: true, passive: false });
    document.addEventListener('contextmenu', handleContextMenu, { capture: true, passive: false });

    return () => {
      document.removeEventListener('keydown', handleKeyEvent, { capture: true });
      document.removeEventListener('keyup', handleKeyEvent, { capture: true });
      document.removeEventListener('mousedown', handleMouseDown, { capture: true });
      document.removeEventListener('contextmenu', handleContextMenu, { capture: true });
    };
  }, [isEnabled, onViolation]);
};
