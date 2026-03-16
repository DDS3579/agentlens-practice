import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function AgentCard({ agentName, agent, name, icon: IconComponent, status: propStatus, color }) {
  const resolvedName = agentName || name?.toLowerCase() || 'unknown';
  const resolvedStatus = agent?.status || propStatus || 'idle';
  const currentAction = agent?.currentAction || null;
  const findings = agent?.findings || 0;

  const [showCompleteFlash, setShowCompleteFlash] = useState(false);

  useEffect(() => {
    if (resolvedStatus === 'complete') {
      setShowCompleteFlash(true);
      const timer = setTimeout(() => setShowCompleteFlash(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [resolvedStatus]);

  const status = resolvedStatus;

  const agentConfig = {
    coordinator: { emoji: "🧠", displayName: "Coordinator" },
    security:    { emoji: "🛡️", displayName: "Security" },
    writer:      { emoji: "📝", displayName: "Writer" },
    architecture:{ emoji: "🏗️", displayName: "Architecture" },
  };

  const { emoji, displayName } = agentConfig[resolvedName] || { emoji: "🤖", displayName: name || resolvedName };

  const statusConfig = {
    idle:     { text: "Idle",       variant: "outline", className: "text-muted-foreground border-border/50" },
    thinking: { text: "Thinking…",  variant: "default", className: "bg-amber-500/15 text-amber-400 border-amber-500/20 animate-pulse" },
    acting:  { text: "Acting",     variant: "default", className: "bg-blue-500/15 text-blue-400 border-blue-500/20 animate-pulse" },
    complete:{ text: "Done ✓",     variant: "default", className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" },
    error:   { text: "Error",      variant: "default", className: "bg-red-500/15 text-red-400 border-red-500/20" },
  };

  const { text: statusText, className: statusClass } = statusConfig[status] || statusConfig.idle;

  const isRunning = status === 'thinking' || status === 'acting';

  const borderColor =
    status === 'thinking' ? 'border-amber-500/25' :
    status === 'acting'   ? 'border-blue-500/25' :
    status === 'complete' ? 'border-emerald-500/25' :
    status === 'error'    ? 'border-red-500/25' :
    'border-border/50';

  const progressColor =
    status === 'thinking' ? 'bg-amber-500' :
    status === 'acting'   ? 'bg-blue-500' :
    'bg-violet-500';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      whileHover={{ y: -1 }}
    >
      <Card className={`${borderColor} p-3 transition-all duration-300 overflow-hidden ${showCompleteFlash ? 'glow-violet-sm' : ''}`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-base shrink-0">{emoji}</span>
            <span className="font-medium text-foreground text-sm truncate">{displayName}</span>
            {isRunning && (
              <motion.span
                animate={{ scale: [1, 1.4, 1], opacity: [1, 0.4, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="w-1.5 h-1.5 rounded-full bg-violet-500 shrink-0"
              />
            )}
          </div>
          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 ${statusClass}`}>
            {statusText}
          </Badge>
        </div>

        {/* Current Action */}
        <AnimatePresence mode="wait">
          {currentAction && (
            <motion.p
              key={currentAction}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="text-xs text-muted-foreground truncate"
              title={currentAction}
            >
              {currentAction}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Progress Bar */}
        <AnimatePresence>
          {(status === 'thinking' || status === 'acting') && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-2"
            >
              <div className="h-0.5 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className={`h-full w-1/3 ${progressColor} rounded-full`}
                  animate={{ x: ['-100%', '300%'] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}