import React, { useEffect, useRef } from 'react';
import { Terminal } from 'lucide-react';

export default function PipelineLogs({ logs }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="glass-panel overflow-hidden flex flex-col h-full border border-slate-700/50 shadow-2xl">
      <div className="px-5 py-3 border-b border-slate-700/50 bg-slate-800/50 flex items-center gap-2 backdrop-blur-md">
        <Terminal size={16} className="text-slate-400" />
        <h3 className="text-sm font-medium text-slate-300 tracking-wide">Pipeline Logs</h3>
      </div>
      
      <div 
        ref={scrollRef}
        className="flex-1 p-5 bg-slate-950/80 overflow-y-auto font-mono text-[13px] leading-relaxed"
      >
        {logs.length === 0 ? (
          <div className="text-slate-600 italic">No logs available. Run the pipeline to see output.</div>
        ) : (
          logs.map((log, index) => {
            let color = 'text-slate-300';
            if (log.toLowerCase().includes('fail') || log.toLowerCase().includes('error') || log.toLowerCase().includes('stop')) color = 'text-red-400';
            if (log.toLowerCase().includes('success') || log.toLowerCase().includes('passed') || log.toLowerCase().includes('completed')) color = 'text-emerald-400';
            
            return (
              <div key={index} className={`mb-1.5 ${color}`}>
                {log}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
