import { useState } from 'react';
import Header from './components/Header';
import Pipeline from './components/Pipeline';
import PipelineLogs from './components/PipelineLogs';
import PipelineStats from './components/PipelineStats';
import { initialStages } from './data/pipelineData';
import { AlertCircle } from 'lucide-react';

export default function App() {
  const [stages, setStages] = useState(initialStages);
  const [pipelineState, setPipelineState] = useState('idle'); // idle, running, success, failed
  const [failedStageId, setFailedStageId] = useState(null);
  const [logs, setLogs] = useState([]);
  const [progress, setProgress] = useState(0);
  const [simResult, setSimResult] = useState('success');
  const [totalTime, setTotalTime] = useState(0);
  const [branch, setBranch] = useState('main');

  const addLog = (msg) => {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false });
    setLogs(prev => [...prev, `[${time}] ${msg}`]);
  };

  const updateStage = (id, updates) => {
    setStages(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const runPipeline = async () => {
    setPipelineState('running');
    setStages(initialStages);
    setLogs([]);
    setProgress(0);
    setTotalTime(0);
    setFailedStageId(null);
    
    addLog('Pipeline started');
    
    const stageTimes = {
      checkout: 2,
      'setup-node': 2,
      install: 3,
      typecheck: 3,
      lint: 3,
      test: 4,
      verify: 3
    };
    
    let currentTotal = 0;
    let completedStages = 0;
    
    const runStage = async (stageId, durationSec) => {
      updateStage(stageId, { status: 'running' });
      
      let sec = 0;
      return new Promise((resolve, reject) => {
        const interval = setInterval(() => {
          sec++;
          currentTotal++;
          setTotalTime(currentTotal);
          updateStage(stageId, { duration: sec });
          
          if (sec >= durationSec) {
            clearInterval(interval);
            
            const isFailure = 
              (simResult === 'typecheck_failed' && stageId === 'typecheck') ||
              (simResult === 'lint_failed' && stageId === 'lint') ||
              (simResult === 'test_failed' && stageId === 'test') ||
              (simResult === 'verify_failed' && stageId === 'verify');
              
            if (isFailure) {
              updateStage(stageId, { status: 'failed' });
              reject(stageId);
            } else {
              updateStage(stageId, { status: 'success' });
              completedStages++;
              setProgress(Math.floor((completedStages / 7) * 100));
              resolve();
            }
          }
        }, 1000);
      });
    };

    try {
      await runStage('checkout', stageTimes.checkout);
      addLog('Checkout Code completed');
      
      await runStage('setup-node', stageTimes['setup-node']);
      addLog('Node.js 22 configured');
      
      await runStage('install', stageTimes.install);
      addLog('Dependencies installed');
      
      await runStage('typecheck', stageTimes.typecheck);
      addLog('TypeScript type check passed');
      
      await runStage('lint', stageTimes.lint);
      addLog('ESLint validation passed');
      
      await runStage('test', stageTimes.test);
      addLog('Tests passed');
      
      await runStage('verify', stageTimes.verify);
      addLog('Express application initialized successfully');
      
      setPipelineState('success');
      addLog('Pipeline completed successfully');
      
    } catch (failedStage) {
      setPipelineState('failed');
      setFailedStageId(failedStage);
      addLog(`Failure detected at: ${failedStage}`);
      
      setStages(prev => {
        let foundFailed = false;
        return prev.map(s => {
          if (s.id === failedStage) foundFailed = true;
          else if (foundFailed && s.status === 'pending') {
            return { ...s, status: 'skipped' };
          }
          return s;
        });
      });
    }
  };

  const handleReset = () => {
    setPipelineState('idle');
    setStages(initialStages);
    setLogs([]);
    setProgress(0);
    setTotalTime(0);
    setFailedStageId(null);
  };

  const completedCount = stages.filter(s => s.status === 'success').length;

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      <Header 
        pipelineState={pipelineState} 
        onRun={runPipeline} 
        onReset={handleReset}
        simResult={simResult}
        setSimResult={setSimResult}
        branch={branch}
        setBranch={setBranch}
      />
      
      {pipelineState === 'failed' && failedStageId && (
        <div className="mb-6 p-4 rounded-xl glass-panel border border-red-500/30 bg-red-900/10 flex items-center gap-3 animate-pulse">
          <AlertCircle className="text-red-400" />
          <div>
            <h3 className="text-red-400 font-semibold">Pipeline stopped</h3>
            <p className="text-sm text-red-300/80">Failure detected at: {stages.find(s => s.id === failedStageId)?.name || failedStageId}</p>
          </div>
        </div>
      )}

      <Pipeline stages={stages} progress={progress} completedCount={completedCount} />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2 flex flex-col gap-8">
          <PipelineStats stages={stages} pipelineState={pipelineState} totalTime={totalTime} branch={branch} completedCount={completedCount} />
        </div>
        <div className="h-full min-h-[400px]">
          <PipelineLogs logs={logs} />
        </div>
      </div>
    </div>
  );
}
