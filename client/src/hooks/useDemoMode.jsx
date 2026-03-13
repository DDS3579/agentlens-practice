// client/src/hooks/useDemoMode.js

import { useEffect, useCallback, useRef, useState } from 'react';
import useAgentStore from '../store/agentStore.js';
import { DEMO_RESULTS, DEMO_EVENTS } from '../lib/demodata.js';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const useDemoMode = () => {
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const isRunningRef = useRef(false);
  
  const {
    reset,
    setRepoUrl,
    setIsAnalyzing,
    setPipelinePhase,
    setPipelineMessage,
    setRepoSummary,
    setSessionId,
    setPlan,
    addBug,
    setSecuritySummary,
    setDocumentation,
    setDocumentationMeta,
    addRefactor,
    setArchitectureResult,
    setCompilationResult,
    addAgentMessage,
    updateAgentStatus,
    setFinalResults
  } = useAgentStore();

  const handleSSEEvent = useCallback((eventName, data) => {
    switch (eventName) {
      case 'pipeline_start':
        setIsAnalyzing(true);
        break;
        
      case 'pipeline_phase':
        setPipelinePhase(data.phase);
        setPipelineMessage(data.message);
        break;
        
      case 'repo_ready':
        setRepoSummary(data);
        break;
        
      case 'session_created':
        setSessionId(data.sessionId);
        break;
        
      case 'coordinator_plan':
        setPlan(data);
        break;
        
      case 'agent_status':
        updateAgentStatus(data.agentId, data.status, data.message);
        break;
        
      case 'agent_finding':
        addBug(data.finding);
        break;
        
      case 'agent_refactor':
        addRefactor(data.refactor);
        break;
        
      case 'agent_communication':
        addAgentMessage(data);
        break;
        
      case 'security_complete':
        setSecuritySummary(data.summary);
        break;
        
      case 'documentation_complete':
        setDocumentation(data.documentation);
        setDocumentationMeta(data.meta);
        break;
        
      case 'architecture_complete':
        setArchitectureResult(data.result);
        break;
        
      case 'compilation_complete':
        setCompilationResult(data);
        break;
        
      case 'session_status':
        if (data.status === 'complete') {
          setPipelinePhase('complete');
        }
        break;
        
      case 'analysis_complete':
        setIsAnalyzing(false);
        break;
        
      case 'final_results':
        setFinalResults(data);
        setPipelinePhase('complete');
        setIsAnalyzing(false);
        break;
        
      default:
        console.log('Unhandled demo event:', eventName, data);
    }
  }, [
    setIsAnalyzing,
    setPipelinePhase,
    setPipelineMessage,
    setRepoSummary,
    setSessionId,
    setPlan,
    updateAgentStatus,
    addBug,
    addRefactor,
    addAgentMessage,
    setSecuritySummary,
    setDocumentation,
    setDocumentationMeta,
    setArchitectureResult,
    setCompilationResult,
    setFinalResults
  ]);

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
    
    // Replay events with delays
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