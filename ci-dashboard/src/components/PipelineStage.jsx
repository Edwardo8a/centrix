import React from 'react';
import { CheckCircle, XCircle, Loader2, Code, Package, FileCode2, FileCheck, TestTube, Server, CircleDashed, Settings } from 'lucide-react';

const icons = {
  checkout: Code,
  'setup-node': Settings,
  install: Package,
  typecheck: FileCode2,
  lint: FileCheck,
  test: TestTube,
  verify: Server
};

export default function PipelineStage({ stage }) {
  const Icon = icons[stage.id] || Code;
  
  let statusColor = 'text-slate-500';
  let borderColor = 'border-slate-700/50';
  let bgColor = 'bg-slate-800/20';
  let StatusIcon = CircleDashed;
  let pulse = false;
  let opacity = 'opacity-50';

  if (stage.status === 'running') {
    statusColor = 'text-blue-400';
    borderColor = 'border-blue-500/50';
    bgColor = 'bg-blue-900/20';
    StatusIcon = Loader2;
    pulse = true;
    opacity = 'opacity-100';
  } else if (stage.status === 'success') {
    statusColor = 'text-emerald-400';
    borderColor = 'border-emerald-500/30';
    bgColor = 'bg-emerald-900/10';
    StatusIcon = CheckCircle;
    opacity = 'opacity-100';
  } else if (stage.status === 'failed') {
    statusColor = 'text-red-400';
    borderColor = 'border-red-500/40';
    bgColor = 'bg-red-900/10';
    StatusIcon = XCircle;
    opacity = 'opacity-100';
  } else if (stage.status === 'skipped') {
    statusColor = 'text-slate-600';
    borderColor = 'border-slate-800/50';
    bgColor = 'bg-slate-900/20';
    opacity = 'opacity-30';
  }

  return (
    <div className={`flex flex-col items-center w-28 transition-all duration-300 ${opacity}`}>
      <div 
        className={`w-14 h-14 md:w-16 md:h-16 rounded-xl flex items-center justify-center border transition-all duration-500 ${borderColor} ${bgColor} ${pulse ? 'animate-pulse-slow shadow-[0_0_15px_rgba(59,130,246,0.2)]' : ''}`}
      >
        <Icon className={statusColor} size={24} />
      </div>
      <div className="mt-3 text-center">
        <div className="font-medium text-sm text-slate-200 truncate w-full px-1">{stage.name}</div>
        <div className="flex items-center justify-center gap-1 mt-1 text-[10px] md:text-xs text-slate-400">
          <StatusIcon size={12} className={pulse ? 'animate-spin text-blue-400' : ''} />
          <span className="capitalize">{stage.status}</span>
        </div>
        {stage.duration > 0 && (
          <div className="text-[10px] text-slate-500 mt-0.5">{stage.duration}s</div>
        )}
      </div>
    </div>
  );
}
