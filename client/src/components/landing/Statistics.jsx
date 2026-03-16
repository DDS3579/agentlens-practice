import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, ComposedChart
} from 'recharts';

// ─── Training Data (Parsed from Qwen2.5-3B SFT Data) ─────────────────────────
const DATA = [
  { step: 10, loss: 1.261824 }, { step: 20, loss: 1.116739 }, { step: 30, loss: 0.860749 },
  { step: 40, loss: 0.464155 }, { step: 50, loss: 0.209658 }, { step: 60, loss: 0.087499 },
  { step: 70, loss: 0.037351 }, { step: 80, loss: 0.016066 }, { step: 90, loss: 0.011673 },
  { step: 100, loss: 0.010646 }, { step: 110, loss: 0.010006 }, { step: 120, loss: 0.010094 },
  { step: 130, loss: 0.009854 }, { step: 140, loss: 0.009832 }, { step: 150, loss: 0.009892 },
  { step: 160, loss: 0.009978 }, { step: 170, loss: 0.009860 }, { step: 180, loss: 0.009589 },
  { step: 190, loss: 0.009456 }, { step: 200, loss: 0.009685 }, { step: 210, loss: 0.009677 },
  { step: 220, loss: 0.009568 }, { step: 230, loss: 0.009560 }, { step: 240, loss: 0.009444 },
  { step: 250, loss: 0.009757 }, { step: 260, loss: 0.009581 }, { step: 270, loss: 0.009526 },
  { step: 280, loss: 0.009458 }, { step: 290, loss: 0.009664 }, { step: 300, loss: 0.009250 },
  { step: 310, loss: 0.009453 }, { step: 320, loss: 0.009290 }, { step: 330, loss: 0.009561 },
  { step: 340, loss: 0.009244 }, { step: 350, loss: 0.009397 }, { step: 360, loss: 0.009337 },
  { step: 370, loss: 0.009463 }, { step: 380, loss: 0.009413 }, { step: 390, loss: 0.009297 },
  { step: 400, loss: 0.009329 }, { step: 410, loss: 0.009275 }, { step: 420, loss: 0.009461 },
  { step: 430, loss: 0.009206 }, { step: 440, loss: 0.009252 }, { step: 450, loss: 0.009248 },
  { step: 460, loss: 0.009228 }, { step: 470, loss: 0.009550 }, { step: 480, loss: 0.009395 },
  { step: 490, loss: 0.009496 }, { step: 500, loss: 0.009315 }, { step: 510, loss: 0.009326 },
  { step: 520, loss: 0.009111 }, { step: 530, loss: 0.009464 }
].map((item, idx, arr) => {
  const reduction_rate = idx === 0 ? 0 : item.loss - arr[idx-1].loss;
  const initial_loss = arr[0].loss;
  const percentage_reduction = ((initial_loss - item.loss) / initial_loss) * 100;
  // Simple 5-point rolling average for smoothing
  const slice = arr.slice(Math.max(0, idx - 4), idx + 1);
  const smoothed = slice.reduce((sum, curr) => sum + curr.loss, 0) / slice.length;
  
  return {
    ...item,
    reduction_rate,
    percentage_reduction,
    smoothed_loss: smoothed
  };
});

// ─── Custom Styles ──────────────────────────────────────────────────────────
const CHART_STYLES = {
  purple: "#8b5cf6",
  indigo: "#6366f1",
  red: "#ef4444",
  green: "#10b981",
  glass: "bg-gray-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-6",
  text: "#9ca3af",
  grid: "rgba(255, 255, 255, 0.05)"
};

const CustomTooltip = ({ active, payload, label, unit = "" }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900/90 backdrop-blur-md border border-white/10 p-3 rounded-lg shadow-2xl">
        <p className="text-gray-400 text-[10px] uppercase tracking-wider mb-1">Step {label}</p>
        {payload.map((item, i) => (
          <p key={i} className="text-sm font-bold" style={{ color: item.color }}>
            {item.name}: {item.value.toFixed(6)}{unit}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// ─── Statistics Component ───────────────────────────────────────────────────
const Statistics = () => {
  return (
    <section id="statistics" className="relative bg-black py-32 px-4">
      {/* Background radial effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 right-0 w-[600px] h-[600px] bg-purple-600/5 rounded-full blur-[140px]" />
        <div className="absolute bottom-1/4 left-0 w-[600px] h-[600px] bg-indigo-600/5 rounded-full blur-[140px]" />
      </div>

      <div className="relative z-10 max-w-[1240px] mx-auto">
        {/* Section Header */}
        <div className="text-center mb-24">
          <motion.span
            className="text-purple-400 text-xs font-semibold tracking-[0.4em] uppercase mb-4 block"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            Model Performance
          </motion.span>
          <motion.h2
            className="font-display text-4xl md:text-5xl font-bold text-white tracking-tight mb-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            SFT Training <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-500">Analytics</span>
          </motion.h2>
          <motion.p
            className="text-gray-400 text-base max-w-xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Detailed analysis of the Qwen2.5-3B fine-tuning process for software architecture documentation generation.
          </motion.p>
        </div>

        {/* ─── Bento Grid of Charts ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-[300px]">
          
          {/* 1. Training Loss Curve (Large) */}
          <div className={`${CHART_STYLES.glass} lg:col-span-2 lg:row-span-2`}>
            <h3 className="text-white text-sm font-medium mb-6 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
              Training Loss Curve
            </h3>
            <div className="h-[calc(100%-40px)] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={DATA}>
                  <defs>
                    <linearGradient id="colorLoss" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_STYLES.purple} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={CHART_STYLES.purple} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_STYLES.grid} vertical={false} />
                  <XAxis dataKey="step" stroke={CHART_STYLES.text} fontSize={10} />
                  <YAxis stroke={CHART_STYLES.text} fontSize={10} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="loss" name="Loss" stroke={CHART_STYLES.purple} strokeWidth={3} fillOpacity={1} fill="url(#colorLoss)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 2. Log-Scaled Loss Curve */}
          <div className={`${CHART_STYLES.glass} lg:col-span-2`}>
            <h3 className="text-white text-sm font-medium mb-4 flex items-center gap-2">
              Log-Scaled Convergence
            </h3>
            <div className="h-[calc(100%-40px)] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={DATA}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_STYLES.grid} vertical={false} />
                  <XAxis dataKey="step" stroke={CHART_STYLES.text} fontSize={10} />
                  <YAxis scale="log" domain={['auto', 'auto']} stroke={CHART_STYLES.text} fontSize={10} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="loss" name="Log Loss" stroke={CHART_STYLES.indigo} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 3. Loss Reduction Rate */}
          <div className={`${CHART_STYLES.glass}`}>
            <h3 className="text-white text-sm font-medium mb-4">Step Change</h3>
            <div className="h-[calc(100%-40px)] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={DATA.slice(0, 15)}>
                  <Bar dataKey="reduction_rate" name="Change" fill={CHART_STYLES.red} radius={[2, 2, 0, 0]} />
                  <XAxis dataKey="step" hide />
                  <Tooltip content={<CustomTooltip />} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 4. Smoothed Loss Curve */}
          <div className={`${CHART_STYLES.glass}`}>
            <h3 className="text-white text-sm font-medium mb-4">Smoothed Trend</h3>
            <div className="h-[calc(100%-40px)] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={DATA}>
                  <Line type="monotone" dataKey="smoothed_loss" name="Avg Loss" stroke={CHART_STYLES.purple} strokeWidth={2} dot={false} />
                  <Tooltip content={<CustomTooltip />} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 5. Loss Convergence Highlight */}
          <div className={`${CHART_STYLES.glass}`}>
            <h3 className="text-white text-sm font-medium mb-4">Convergence Pt</h3>
            <div className="flex flex-col items-center justify-center h-[calc(100%-40px)]">
              <div className="text-3xl font-bold text-white font-display mb-1">Step 120</div>
              <p className="text-purple-400 text-[10px] uppercase tracking-widest font-semibold">Stability baseline</p>
            </div>
          </div>

          {/* 6. Training Stability (Zoom) */}
          <div className={`${CHART_STYLES.glass} lg:col-span-2`}>
            <h3 className="text-white text-sm font-medium mb-4 flex items-center justify-center">
              Tail Stability (Steps 200+)
            </h3>
            <div className="h-[calc(100%-40px)] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={DATA.filter(d => d.step >= 200)}>
                  <YAxis domain={[0.009, 0.01]} hide />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="loss" stroke={CHART_STYLES.green} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 7. Training Progress Area */}
          <div className={`${CHART_STYLES.glass}`}>
            <h3 className="text-white text-sm font-medium mb-4">% Improvement</h3>
            <div className="h-[calc(100%-40px)] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={DATA}>
                  <Area type="monotone" dataKey="percentage_reduction" fill={CHART_STYLES.purple} stroke={CHART_STYLES.purple} fillOpacity={0.2} />
                  <Tooltip content={<CustomTooltip unit="%" />} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* Footer info */}
        <div className="mt-12 text-center">
          <p className="text-gray-500 text-[11px] flex items-center justify-center gap-2 tracking-wide uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/40 animate-pulse" />
            Dataset size: 20,000 examples · Method: Supervised Fine-Tuning · Base: Qwen2.5-3B
          </p>
        </div>
      </div>
    </section>
  );
};

export default Statistics;
