// client/src/hooks/useDemoMode.js

import { useEffect, useCallback, useRef, useState } from 'react';
import useAgentStore from '../store/agentStore.js';
import { DEMO_RESULTS, DEMO_EVENTS } from '../lib/demoData.js';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const useDemoMode = () => {
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const isRunningRef = useRef(false);
  
  // Use V2 store API — route all events through handleSSEEvent
  const { reset, setRepoUrl, handleSSEEvent } = useAgentStore();

  const startDemoMode = useCallback(async () => {
    if (isRunningRef.current) {
      console.log('Demo mode already running');
      return;
    }
    
    isRunningRef.current = true;
    setIsDemoMode(true);
    
    // Show toast notification
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
    
    // Reset store to clean state
    reset();
    
    // Set repo URL
    setRepoUrl('https://github.com/demo-user/vulnerable-express-api');
    
    // Replay events with delays — route through V2 handleSSEEvent
    for (const event of DEMO_EVENTS) {
      if (!isRunningRef.current) break;
      
      await delay(event.delayMs);
      handleSSEEvent(event.eventName, event.data);
    }
    
    // Ensure final state is set
    handleSSEEvent('final_results', DEMO_RESULTS);
    
    isRunningRef.current = false;
  }, [reset, setRepoUrl, handleSSEEvent]);

  // Listen for Ctrl+Shift+D keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        startDemoMode();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [startDemoMode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isRunningRef.current = false;
    };
  }, []);

  // Render demo mode indicator and toast
  const DemoModeIndicator = () => (
    <>
      {/* Toast notification */}
      {showToast && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[300] animate-fade-in">
          <div className="bg-purple-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3">
            <span className="text-xl">🎭</span>
            <span className="font-medium">Demo mode activated</span>
          </div>
        </div>
      )}
      
      {/* Persistent indicator */}
      {isDemoMode && (
        <div className="fixed bottom-4 left-4 z-[200]">
          <div className="bg-purple-600/90 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-2 text-sm">
            <span>🎭</span>
            <span className="font-medium">DEMO MODE</span>
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translate(-50%, -20px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </>
  );

  return {
    isDemoMode,
    startDemoMode,
    DemoModeIndicator
  };
};

export default useDemoMode;