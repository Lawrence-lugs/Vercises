import React, { useState, useRef, useEffect, useCallback } from 'react';
import MonacoEditor from '@monaco-editor/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

function getExerciseFromPath() {
  const match = window.location.pathname.match(/^\/exercises\/([^/]+)/);
  return match ? match[1] : null;
}

// ─────────────────────────────────────────────────────────────
// Root router
// ─────────────────────────────────────────────────────────────
export default function App() {
  const pathname = window.location.pathname;
  if (pathname === '/exercises') return <ExercisesList />;
  return <ExerciseView />;
}

// ─────────────────────────────────────────────────────────────
// Main exercise view
// ─────────────────────────────────────────────────────────────
function ExerciseView() {
  // ── File / editor state ──────────────────────────────────
  const [tabs, setTabs]               = useState([]);
  const [activeTab, setActiveTab]     = useState(0);
  const [hiddenFiles, setHiddenFiles] = useState([]);

  // ── Markdown ──────────────────────────────────────────────
  const [instructions, setInstructions] = useState('');

  // ── Simulation state ─────────────────────────────────────
  const [simCmd, setSimCmd]           = useState('iverilog');
  const [enableArgs, setEnableArgs]   = useState(true);
  const [simArgs, setSimArgs]         = useState('');
  const [runCmd, setRunCmd]           = useState('./a.out');
  const [runCooldown, setRunCooldown] = useState(false);
  const [output, setOutput]           = useState('');
  const [outputAnim, setOutputAnim]   = useState(false);
  const [isRunning, setIsRunning]     = useState(false);

  // ── Slide-up simulation panel ─────────────────────────────
  const [simOpen, setSimOpen]       = useState(false);
  const [simMounted, setSimMounted] = useState(false);

  // ── Draggable vertical divider ────────────────────────────
  const [dividerX, setDividerX] = useState(Math.round(window.innerWidth * 0.40));
  const dragging   = useRef(false);
  const containerRef = useRef(null);
  const rightPaneRef = useRef(null);

  const exercise = getExerciseFromPath();

  // ── Load exercise data ────────────────────────────────────
  useEffect(() => {
    if (exercise) {
      fetch(`/api/exercise/${exercise}`)
        .then(r => r.json())
        .then(data => {
          setTabs(data.files);
          setActiveTab(0);
          setInstructions(data.instructions);
          const cfg = data.config || {};
          setSimCmd(cfg.simulation_command || 'iverilog');
          setRunCmd(cfg.run_command || './a.out');
          setHiddenFiles(cfg.hidden || []);
          if (cfg.enable_args === true) {
            setSimArgs(cfg.default_args || data.files.map(f => f.name).join(' '));
          }
          setEnableArgs(cfg.enable_args !== false);
        });
    } else {
      setTabs([
        { name: 'alu.v',    content: '// Verilog code for ALU\nmodule alu(...);\nendmodule' },
        { name: 'tb_alu.v', content: '// Testbench for ALU\nmodule tb_alu(...);\nendmodule' },
      ]);
      setActiveTab(0);
      setInstructions('# Build an ALU\n\nDesign an ALU that supports add, subtract, and, or operations.\n\n## Specs\n- Inputs: a, b, op\n- Outputs: result');
      setSimCmd('iverilog');
      setRunCmd('./a.out');
      setHiddenFiles([]);
      setSimArgs('tb_alu.v alu.v');
      setEnableArgs(true);
    }
  }, [window.location.pathname]);

  // ── Run handler ───────────────────────────────────────────
  const handleRun = useCallback(async () => {
    if (runCooldown) return;
    setRunCooldown(true);
    setIsRunning(true);
    setSimMounted(true);
    setSimOpen(true);

    const files = tabs.map(t => ({ name: t.name, content: t.content }));

    if (hiddenFiles.length > 0 && exercise) {
      const extra = await Promise.all(
        hiddenFiles.map(async fname => {
          const res = await fetch(`/exercises/${exercise}/${fname}`);
          const content = await res.text();
          return { name: fname, content };
        })
      );
      files.push(...extra);
    }

    const simCmdFull = enableArgs ? `${simCmd} ${simArgs}`.trim() : simCmd;
    const res = await fetch('/api/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ files, simCmd: simCmdFull, runCmd }),
    });
    const data = await res.json();

    setOutputAnim(false);
    setOutput(data.output);
    setIsRunning(false);
    setTimeout(() => setOutputAnim(true), 10);
    setTimeout(() => setRunCooldown(false), 1000);
  }, [runCooldown, tabs, hiddenFiles, exercise, simCmd, simArgs, runCmd, enableArgs]);

  const handleClosePanel = () => {
    setSimOpen(false);
    setTimeout(() => setSimMounted(false), 260);
  };

  // ── Divider drag ──────────────────────────────────────────
  useEffect(() => {
    const onMove = e => {
      if (!dragging.current) return;
      const cw = containerRef.current?.offsetWidth || window.innerWidth;
      setDividerX(Math.max(260, Math.min(e.clientX, cw - 300)));
    };
    const onUp = () => { dragging.current = false; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  const exerciseLabel = exercise
    ? exercise.charAt(0).toUpperCase() + exercise.slice(1)
    : 'Demo';

  return (
    <div className="flex flex-col h-screen bg-white text-gray-800 font-sans overflow-hidden">

      {/* ── Top Navbar ──────────────────────────────────────── */}
      <header className="flex items-center justify-between h-12 px-5 bg-white border-b border-[#dee2e6] shrink-0 z-20">
        <a
          href="/exercises"
          className="flex items-baseline gap-2 text-[#6B0D1A] font-bold text-lg tracking-tight no-underline hover:text-[#A52033] transition-colors"
        >
          Vercises
          <span className="text-[#616161] text-xs font-normal tracking-normal normal-case">
            © Lawrence Quizon
          </span>
        </a>


        <span className="text-[#616161] text-sm font-medium tracking-widest uppercase">
          {exerciseLabel}
        </span>

        <button
          onClick={handleRun}
          disabled={runCooldown}
          className={[
            'flex items-center gap-2 px-4 py-1.5 rounded text-sm font-semibold text-white transition-colors',
            runCooldown
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-[#6B0D1A] hover:bg-[#A52033] cursor-pointer',
          ].join(' ')}
        >
          {isRunning ? (
            <>
              <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Running…
            </>
          ) : (
            <>
              <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="currentColor">
                <path d="M3 2.5l10 5.5-10 5.5V2.5z" />
              </svg>
              Run
            </>
          )}
        </button>
      </header>

      {/* ── Main split area ──────────────────────────────────── */}
      <div ref={containerRef} className="flex flex-1 relative overflow-hidden">

        {/* Left: Instructions */}
        <div
          className="h-full overflow-y-auto bg-white shrink-0"
          style={{ width: dividerX }}
        >
          <div className="md-prose px-12 py-10 max-w-2xl">
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeKatex]}
              components={{
                img: ({ node, ...props }) => {
                  let src = props.src || '';
                  if (exercise && !src.startsWith('/') && !src.startsWith('http')) {
                    src = `/exercises/${exercise}/${src}`;
                  }
                  return <img {...props} src={src} className="max-w-full h-auto rounded-md my-4" />;
                },
              }}
            >
              {instructions}
            </ReactMarkdown>
          </div>
        </div>

        {/* Vertical divider */}
        <div
          className="w-1.5 shrink-0 bg-[#dee2e6] hover:bg-[#A52033] cursor-col-resize transition-colors z-10"
          onMouseDown={() => { dragging.current = true; }}
        />

        {/* Right: Editor + slide-up sim panel */}
        <div ref={rightPaneRef} className="flex flex-col flex-1 h-full bg-[#f8f9fa] overflow-hidden relative">

          {/* Tab bar */}
          <div className="flex bg-white border-b border-[#dee2e6] shrink-0">
            {tabs.map((tab, i) => (
              <button
                key={tab.name}
                onClick={() => setActiveTab(i)}
                className={[
                  'px-4 py-2.5 text-sm font-medium transition-colors focus:outline-none whitespace-nowrap',
                  i === activeTab
                    ? 'border-b-2 border-[#6B0D1A] text-[#6B0D1A] bg-white'
                    : 'text-[#616161] hover:text-gray-800 hover:bg-gray-50',
                ].join(' ')}
              >
                {tab.name}
              </button>
            ))}
          </div>

          {/* Monaco editor */}
          {tabs.length > 0 && (
            <div className="flex-1 overflow-hidden">
              <MonacoEditor
                height="100%"
                theme="vs"
                language="verilog"
                value={tabs[activeTab]?.content ?? ''}
                options={{
                  fontFamily: "'Cascadia Code', 'Fira Mono', Consolas, monospace",
                  fontSize: 14,
                  lineHeight: 22,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  padding: { top: 12 },
                  renderLineHighlight: 'gutter',
                }}
                onChange={val => {
                  setTabs(prev => {
                    const next = [...prev];
                    next[activeTab] = { ...next[activeTab], content: val };
                    return next;
                  });
                }}
              />
            </div>
          )}

          {/* Slide-up sim panel — scoped to right column */}
          {simMounted && (
            <SimulationPanel
              open={simOpen}
              onClose={handleClosePanel}
              isRunning={isRunning}
              simCmd={simCmd}
              runCmd={runCmd}
              enableArgs={enableArgs}
              simArgs={simArgs}
              onSimArgsChange={setSimArgs}
              output={output}
              outputAnim={outputAnim}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Simulation slide-up panel (absolute inside right column)
// ─────────────────────────────────────────────────────────────
function SimulationPanel({
  open, onClose, isRunning,
  simCmd, runCmd, enableArgs, simArgs, onSimArgsChange,
  output, outputAnim,
}) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setAnimated(open));
    return () => cancelAnimationFrame(id);
  }, [open]);

  const visible = animated && open;

  return (
    <div
      className={[
        'absolute bottom-0 left-0 right-0 z-30',
        'bg-white border-t-2 border-[#6B0D1A]',
        'shadow-[0_-4px_20px_rgba(107,13,26,0.10)]',
        'flex flex-col',
        'transition-transform duration-[260ms] ease-[cubic-bezier(0.4,0,0.2,1)]',
        visible ? 'translate-y-0' : 'translate-y-full',
      ].join(' ')}
      style={{ height: '42%', minHeight: '180px', maxHeight: '58%' }}
    >
      {/* Panel header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#dee2e6] shrink-0 bg-white">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[#6B0D1A] font-semibold text-xs tracking-widest uppercase">
            Simulation
          </span>
          <span className="text-[#dee2e6] select-none">|</span>
          <code className="bg-[#f1f3f5] text-gray-700 text-xs px-2 py-0.5 rounded font-mono">
            {simCmd}
          </code>
          {enableArgs && (
            <input
              value={simArgs}
              onChange={e => onSimArgsChange(e.target.value)}
              className="bg-[#f1f3f5] text-gray-700 text-xs px-2 py-0.5 rounded font-mono border border-[#dee2e6] focus:outline-none focus:border-[#A52033] min-w-[80px] w-40"
              spellCheck={false}
            />
          )}
          <code className="bg-[#f1f3f5] text-gray-700 text-xs px-2 py-0.5 rounded font-mono">
            {runCmd}
          </code>
          {isRunning && (
            <svg className="animate-spin h-3 w-3 text-[#A52033]" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          )}
        </div>

        <button
          onClick={onClose}
          className="text-[#616161] hover:text-[#6B0D1A] transition-colors text-xl leading-none px-1 ml-2"
          aria-label="Close simulation panel"
        >
          ×
        </button>
      </div>

      {/* Output */}
      <div className="flex-1 overflow-y-auto bg-[#f8f9fa] p-4">
        {isRunning && !output ? (
          <p className="text-[#616161] text-sm italic">Running simulation…</p>
        ) : (
          <pre
            className={[
              'output-pre font-mono text-sm text-gray-800 whitespace-pre-wrap break-words leading-relaxed m-0',
              outputAnim ? 'output-anim' : '',
            ].join(' ')}
          >
            {output || <span className="text-[#616161] italic">No output yet.</span>}
          </pre>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Exercises listing page  (/exercises)
// ─────────────────────────────────────────────────────────────
function ExercisesList() {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  useEffect(() => {
    fetch('/api/exercises')
      .then(r => {
        if (!r.ok) throw new Error('Failed to fetch exercises');
        return r.json();
      })
      .then(data => { setExercises(data.exercises); setLoading(false); })
      .catch(err  => { setError(err.message);       setLoading(false); });
  }, []);

  return (
    <div className="min-h-screen bg-[#f8f9fa] font-sans">
      <header className="bg-white border-b border-[#dee2e6] px-6 h-12 flex items-center">
        <a
          href="/exercises"
          className="flex items-baseline gap-2 text-[#6B0D1A] font-bold text-lg tracking-tight no-underline hover:text-[#A52033] transition-colors"
        >
          Vercises
          <span className="text-[#616161] text-xs font-normal tracking-normal normal-case">
            © Lawrence Quizon
          </span>
        </a>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold text-[#6B0D1A] mb-1">Exercises</h1>
        <p className="text-[#616161] mb-8 text-sm">Pick an exercise to start coding in Verilog.</p>

        {loading && <p className="text-[#616161]">Loading…</p>}
        {error   && <p className="text-red-600">Error: {error}</p>}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {exercises.map((ex, idx) => (
            <a
              key={idx}
              href={`/exercises/${ex}`}
              className="group block rounded-lg border border-[#dee2e6] bg-white shadow-sm p-5 no-underline hover:shadow-md hover:border-[#A52033] transition-all duration-150"
            >
              <div className="flex items-start justify-between">
                <h2 className="text-base font-semibold text-gray-800 group-hover:text-[#6B0D1A] transition-colors capitalize">
                  {ex}
                </h2>
                <svg
                  className="h-4 w-4 text-[#dee2e6] group-hover:text-[#A52033] transition-colors mt-0.5 shrink-0"
                  viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"
                >
                  <path d="M3 8h10M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="mt-1 text-xs text-[#616161] font-mono">/exercises/{ex}</p>
            </a>
          ))}
        </div>
      </main>
    </div>
  );
}
