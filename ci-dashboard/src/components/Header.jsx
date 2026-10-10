import React from 'react';
import { Play, RotateCcw, GitBranch, GitCommit, PlayCircle } from 'lucide-react';

export default function Header({ pipelineState, onRun, onReset, simResult, setSimResult, branch, setBranch }) {
  let statusBadge = (
    <span className="text-xs px-2 py-1 rounded-md bg-slate-800 text-slate-400 border border-slate-700">
      Ready
    </span>
  );
  if (pipelineState === 'running') {
    statusBadge = (
      <span className="text-xs px-2 py-1 rounded-md bg-blue-900/30 text-blue-400 border border-blue-800/50 flex items-center gap-1">
        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
        Running
      </span>
    );
  } else if (pipelineState === 'success') {
    statusBadge = (
      <span className="text-xs px-2 py-1 rounded-md bg-emerald-900/30 text-emerald-400 border border-emerald-800/50">
        Success
      </span>
    );
  } else if (pipelineState === 'failed') {
    statusBadge = (
      <span className="text-xs px-2 py-1 rounded-md bg-red-900/30 text-red-400 border border-red-800/50">
        Failed
      </span>
    );
  }

  return (
    <div className="glass-panel p-5 flex flex-col md:flex-row items-center justify-between mb-8 gap-4 md:gap-0">
      <div className="flex flex-col w-full md:w-auto">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-medium tracking-wide text-slate-100">
            Centrix
          </h1>
          {statusBadge}
        </div>
        <h2 className="text-2xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400 mt-1">
          CI Pipeline Monitoring
        </h2>
        
        <div className="flex gap-6 text-sm text-slate-400 mt-3 items-center">
          <div className="flex items-center gap-1.5 bg-slate-900/50 px-2 py-1 rounded-md border border-slate-800">
            <GitBranch size={14} className="text-slate-500" /> 
            <select 
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              disabled={pipelineState === 'running'}
              className="bg-transparent focus:outline-none cursor-pointer text-slate-300"
            >
              <option value="main" className="bg-slate-800">main</option>
              <option value="dev" className="bg-slate-800">dev</option>
              <option value="sprint" className="bg-slate-800">sprint</option>
            </select>
          </div>
          <span className="flex items-center gap-1.5"><GitCommit size={14} className="text-slate-500" /> <span className="font-mono">a83f21c</span></span>
        </div>
      </div>
      
      <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
        <div className="flex flex-col">
          <label className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1">Simulation</label>
          <select 
            value={simResult} 
            onChange={(e) => setSimResult(e.target.value)}
            disabled={pipelineState === 'running'}
            className="bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500/50 transition-colors"
          >
            <option value="success">Successful Pipeline</option>
            <option value="typecheck_failed">Type Check Failed</option>
            <option value="lint_failed">Lint Failed</option>
            <option value="test_failed">Tests Failed</option>
            <option value="verify_failed">Verify App Failed</option>
          </select>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={onReset}
            disabled={pipelineState === 'running'}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 disabled:opacity-50 disabled:hover:bg-slate-800 px-4 py-2 rounded-lg font-medium transition-colors text-sm"
          >
            <RotateCcw size={16} /> Reset
          </button>
          <button 
            onClick={onRun} 
            disabled={pipelineState === 'running'}
            className="flex items-center gap-2 bg-blue-600/90 hover:bg-blue-500 border border-blue-500/50 disabled:opacity-50 disabled:hover:bg-blue-600/90 px-6 py-2 rounded-lg font-medium transition-all shadow-[0_0_15px_rgba(37,99,235,0.2)] text-sm text-white"
          >
            <PlayCircle size={16} /> Run Pipeline
          </button>
        </div>
      </div>
    </div>
  );
}
