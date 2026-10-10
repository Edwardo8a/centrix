import React from 'react';
import { Bot, Sparkles, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function AgentPanel({ message, pipelineState }) {
  let statusColor = 'text-blue-400';
  let glow = '';
  
  if (pipelineState === 'running') {
    glow = 'shadow-[0_0_20px_rgba(59,130,246,0.3)] border-blue-500/50';
  } else if (pipelineState === 'success') {
    statusColor = 'text-emerald-400';
    glow = 'shadow-[0_0_20px_rgba(16,185,129,0.2)] border-emerald-500/30';
  } else if (pipelineState === 'failed') {
    statusColor = 'text-red-400';
    glow = 'shadow-[0_0_20px_rgba(239,68,68,0.2)] border-red-500/30';
  }

  return (
    <div className={`glass-panel p-6 flex items-start gap-4 transition-all duration-500 ${glow}`}>
      <div className="relative">
        <div className={`w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center ${statusColor}`}>
          <Bot size={28} />
        </div>
        {pipelineState === 'running' && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-ping"></span>
        )}
      </div>
      
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-semibold text-slate-200">CI Agent</h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
            {pipelineState === 'running' ? 'Monitoring' : pipelineState === 'idle' ? 'Standby' : pipelineState === 'success' ? 'Finished' : 'Error'}
          </span>
        </div>
        
        <div className="bg-slate-900/80 rounded-lg p-4 border border-slate-700/50 relative">
          <div className="absolute top-0 left-4 -mt-2 w-4 h-4 bg-slate-900 border-t border-l border-slate-700/50 transform rotate-45"></div>
          <p className="text-sm text-slate-300 leading-relaxed z-10 relative flex gap-2 items-start">
            {pipelineState === 'running' && <Sparkles size={16} className="text-blue-400 flex-shrink-0 mt-0.5" />}
            {pipelineState === 'success' && <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0 mt-0.5" />}
            {pipelineState === 'failed' && <AlertTriangle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />}
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}
