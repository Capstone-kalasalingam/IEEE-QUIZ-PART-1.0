
import { useEffect } from 'react';
import toast from 'react-hot-toast';

interface UseKeyboardMonitoringProps {
  studentData: any;
  onViolation: () => void;
  isEnabled: boolean;
}

export const useKeyboardMonitoring = ({ studentData, onViolation, isEnabled }: UseKeyboardMonitoringProps) => {
  useEffect(() => {
    if (!isEnabled || !studentData?.id) return;

    const clearClipboardBestEffort = async () => {
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText('Screenshots are disabled during the exam.');
          console.log('Clipboard cleared to deter screenshot capture');
        }
      } catch (e) {
        console.log('Clipboard clear failed (expected on some browsers):', e);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      // Screenshot shortcuts
      const isScreenshot = 
        // Print Screen key
        event.key === 'PrintScreen' ||
        // Alt + Print Screen
        (event.altKey && event.key === 'PrintScreen') ||
        // Windows + Print Screen
        (event.metaKey && event.key === 'PrintScreen') ||
        // Ctrl + Print Screen
        (event.ctrlKey && event.key === 'PrintScreen') ||
        // Windows + Shift + S (Windows Snipping Tool) - may not be capturable by browsers, best-effort
        (event.metaKey && event.shiftKey && event.key === 'S') ||
        // Cmd + Shift + 3 (Mac full screenshot)
        (event.metaKey && event.shiftKey && event.key === '3') ||
        // Cmd + Shift + 4 (Mac partial screenshot)
        (event.metaKey && event.shiftKey && event.key === '4') ||
        // Cmd + Shift + 5 (Mac screenshot utility)
        (event.metaKey && event.shiftKey && event.key === '5');

      // Developer tools shortcuts
      const isDevTools = 
        // F12
        event.key === 'F12' ||
        // Ctrl + Shift + I
        (event.ctrlKey && event.shiftKey && event.key === 'I') ||
        // Ctrl + Shift + J (Console)
        (event.ctrlKey && event.shiftKey && event.key === 'J') ||
        // Ctrl + Shift + C (Element inspector)
        (event.ctrlKey && event.shiftKey && event.key === 'C') ||
        // Ctrl + U (View source)
        (event.ctrlKey && event.key === 'u');

      // Other restricted shortcuts
      const isRestricted = 
        // Alt + Tab (Task switching)
        (event.altKey && event.key === 'Tab') ||
        // Ctrl + Alt + Delete
        (event.ctrlKey && event.altKey && event.key === 'Delete') ||
        // Windows key alone
        (event.key === 'Meta' || event.key === 'OS') ||
        // Ctrl + Shift + Esc (Task Manager)
        (event.ctrlKey && event.shiftKey && event.key === 'Escape') ||
        // Alt + F4 (Close window)
        (event.altKey && event.key === 'F4') ||
        // Ctrl + W (Close tab)
        (event.ctrlKey && event.key === 'w') ||
        // Ctrl + T (New tab)
        (event.ctrlKey && event.key === 't') ||
        // Ctrl + N (New window)
        (event.ctrlKey && event.key === 'n') ||
        // Ctrl + Shift + N (Incognito)
        (event.ctrlKey && event.shiftKey && event.key === 'N') ||
        // F1 (Help)
        event.key === 'F1' ||
        // F5, Ctrl + R (Refresh - we allow this but track it)
        event.key === 'F5' ||
        (event.ctrlKey && event.key === 'r');

      if (isScreenshot) {
        event.preventDefault();
        event.stopPropagation();

        // Best-effort attempt to invalidate captured clipboard content (PrintScreen flows)
        clearClipboardBestEffort();
        
        console.log('Screenshot attempt detected - recording violation');
        toast.error('Screenshot blocked! Violation recorded.', {
          duration: 3000,
          position: 'top-center',
          style: {
            background: '#fee2e2',
            color: '#991b1b',
            border: '1px solid #fecaca',
            fontWeight: '600',
          },
        });
        
        onViolation();
        return false;
      }

      if (isDevTools) {
        event.preventDefault();
        event.stopPropagation();
        
        console.log('Developer tools attempt detected - recording violation');
        toast.error('Developer tools blocked! Violation recorded.', {
          duration: 3000,
          position: 'top-center',
          style: {
            background: '#fee2e2',
            color: '#991b1b',
            border: '1px solid #fecaca',
            fontWeight: '600',
          },
        });
        
        onViolation();
        return false;
      }

      if (isRestricted) {
        event.preventDefault();
        event.stopPropagation();
        
        console.log('Restricted shortcut detected - recording violation:', event.key);
        toast.error('Restricted action blocked! Violation recorded.', {
          duration: 3000,
          position: 'top-center',
          style: {
            background: '#fef3c7',
            color: '#92400e',
            border: '1px solid #fde68a',
            fontWeight: '500',
          },
        });
        
        onViolation();
        return false;
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      // Additional check for Print Screen on key up (some browsers only detect it here)
      if (event.key === 'PrintScreen') {
        clearClipboardBestEffort();
        console.log('Print Screen key up detected - recording violation');
        toast.error('Screenshot blocked! Violation recorded.', {
          duration: 3000,
          position: 'top-center',
          style: {
            background: '#fee2e2',
            color: '#991b1b',
            border: '1px solid #fecaca',
            fontWeight: '600',
          },
        });
        
        onViolation();
      }
    };

    // Right click context menu prevention
    const handleContextMenu = (event: MouseEvent) => {
      event.preventDefault();
      console.log('Right click blocked - recording violation');
      toast.error('Right click blocked! Violation recorded.', {
        duration: 2000,
        position: 'top-center',
        style: {
          background: '#fef3c7',
          color: '#92400e',
          border: '1px solid #fde68a',
          fontWeight: '500',
        },
      });
      
      onViolation();
      return false;
    };

    // Disable drag and drop
    const handleDragStart = (event: DragEvent) => {
      event.preventDefault();
      return false;
    };

    // Add event listeners with high priority
    document.addEventListener('keydown', handleKeyDown, { capture: true, passive: false });
    document.addEventListener('keyup', handleKeyUp, { capture: true, passive: false });
    document.addEventListener('contextmenu', handleContextMenu, { capture: true, passive: false });
    document.addEventListener('dragstart', handleDragStart, { capture: true, passive: false });

    return () => {
      document.removeEventListener('keydown', handleKeyDown, { capture: true });
      document.removeEventListener('keyup', handleKeyUp, { capture: true });
      document.removeEventListener('contextmenu', handleContextMenu, { capture: true });
      document.removeEventListener('dragstart', handleDragStart, { capture: true });
    };
  }, [isEnabled, studentData?.id, onViolation]);
};
