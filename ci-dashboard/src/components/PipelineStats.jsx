import React from 'react';
import { Activity, Clock, Layers, TestTube2, GitBranch } from 'lucide-react';

export default function PipelineStats({ stages, pipelineState, totalTime, branch, completedCount }) {
  const testStage = stages.find(s => s.id === 'test');
  
  let testsResult = '-';
  if (testStage.status === 'success') testsResult = 'Passed';
  else if (testStage.status === 'failed') testsResult = 'Failed';
  else if (testStage.status === 'running') testsResult = 'Running...';
  else if (testStage.status === 'skipped') testsResult = 'Skipped';

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      <StatCard 
        icon={<Activity size={18} className="text-blue-400" />}
        label="Pipeline Status"
        value={pipelineState.toUpperCase()}
        highlight={pipelineState === 'success' ? 'text-emerald-400' : pipelineState === 'failed' ? 'text-red-400' : ''}
      />
      <StatCard 
        icon={<Clock size={18} className="text-amber-400" />}
        label="Duration"
        value={`${totalTime}s`}
      />
      <StatCard 
        icon={<Layers size={18} className="text-indigo-400" />}
        label="Stages"
        value={`${completedCount} / 7`}
      />
      <StatCard 
        icon={<TestTube2 size={18} className="text-purple-400" />}
        label="Tests"
        value={testsResult}
        highlight={testStage.status === 'failed' ? 'text-red-400' : ''}
      />
      <StatCard 
        icon={<GitBranch size={18} className="text-slate-400" />}
        label="Branch"
        value={branch}
      />
    </div>
  );
}

function StatCard({ icon, label, value, highlight = '' }) {
  return (
    <div className="glass-panel p-5 flex flex-col justify-between h-full bg-slate-900/40">
      <div className="flex items-center gap-2 mb-3 text-slate-400">
        {icon}
        <span className="text-[10px] uppercase tracking-wider font-semibold">{label}</span>
      </div>
      <div className={`text-xl font-medium text-slate-200 ${highlight}`}>
        {value}
      </div>
    </div>
  );
}
