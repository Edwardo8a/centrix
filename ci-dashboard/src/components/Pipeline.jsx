import React from 'react';
import PipelineStage from './PipelineStage';

export default function Pipeline({ stages, progress, completedCount }) {
  return (
    <div className="glass-panel p-8 mb-8 relative">
      <div className="flex flex-col md:flex-row justify-between items-center relative z-10 gap-4 md:gap-0">
        {stages.map((stage, index) => (
          <React.Fragment key={stage.id}>
            <PipelineStage stage={stage} />
            {index < stages.length - 1 && (
              <div className="hidden md:block flex-1 h-1 mx-2 bg-slate-800 rounded-full overflow-hidden relative">
                <div 
                  className={`h-full bg-blue-500 transition-all duration-500 ${
                    stage.status === 'success' ? 'w-full' : 'w-0'
                  }`}
                />
              </div>
            )}
            {/* Mobile connecting line */}
            {index < stages.length - 1 && (
              <div className="md:hidden w-1 h-8 bg-slate-800 rounded-full overflow-hidden relative">
                 <div 
                  className={`w-full bg-blue-500 transition-all duration-500 ${
                    stage.status === 'success' ? 'h-full' : 'h-0'
                  }`}
                />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
      
      <div className="mt-12">
        <div className="flex justify-between text-sm text-slate-400 mb-2">
          <span>Pipeline Progress</span>
          <span>{progress}%</span>
        </div>
        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-2">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="text-right text-xs text-slate-500">
          {completedCount} / 7 stages completed
        </div>
      </div>
    </div>
  );
}
