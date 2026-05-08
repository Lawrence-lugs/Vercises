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

  // ── New-file tab editing state ────────────────────────────
  const [allowNewFiles, setAllowNewFiles]                       = useState(false);
  const [allowRenameOriginalFiles, setAllowRenameOriginalFiles] = useState(false);
  const [editingTab, setEditingTab]                             = useState(null);
  const [editingIsNew, setEditingIsNew]   = useState(false);
  const [editingValue, setEditingValue]   = useState('');

  // ── Left pane ─────────────────────────────────────────────
  const [hideInstructions, setHideInstructions] = useState(false);

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

  // ── Waveform viewer (Surfer) ──────────────────────────────
  const surferRef    = useRef(null);
  const blobUrlRef   = useRef(null);
  const [surferReady, setSurferReady]   = useState(false);
  const [panelTab, setPanelTab]         = useState('output'); // 'output' | 'waveform'

  // ── Draggable vertical divider ────────────────────────────
  const [dividerX, setDividerX] = useState(Math.round(window.innerWidth * 0.40));
  const dragging        = useRef(false);
  const panelDragging   = useRef(false);
  const containerRef    = useRef(null);
  const rightPaneRef    = useRef(null);
  const editingActionRef = useRef(false);

  // ── Panel height (px) — draggable ─────────────────────────
  const [panelHeight, setPanelHeight] = useState(null); // null = use CSS default (42%)

  const exercise = getExerciseFromPath();

  // ── Surfer postMessage coordination ──────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (e.data?.command === 'surfer-loaded') {
        setSurferReady(true);
        surferRef.current?.contentWindow?.postMessage({ command: 'ToggleMenu' }, '*');
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  function loadVcdIntoSurfer(vcdText) {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    const blob    = new Blob([vcdText], { type: 'text/plain' });
    const blobUrl = URL.createObjectURL(blob);
    blobUrlRef.current = blobUrl;
    surferRef.current?.contentWindow?.postMessage(
      { command: 'LoadUrl', url: blobUrl },
      '*'
    );
  }

  // ── Load exercise data ────────────────────────────────────
  useEffect(() => {
    if (exercise) {
      fetch(`/api/exercise/${exercise}`)
        .then(r => r.json())
        .then(data => {
          const cfg = data.config || {};
          const allowNew = cfg.allow_new_files === true;
          let loadedTabs = data.files.map(f => ({ ...f, userCreated: false }));
          if (allowNew) {
            const stored = localStorage.getItem(`vercises-session-${exercise}`);
            if (stored) {
              try { loadedTabs = JSON.parse(stored).tabs; } catch (_) {}
            }
          }
          setTabs(loadedTabs);
          setActiveTab(0);
          setInstructions(data.instructions);
          setSimCmd(cfg.simulation_command || 'iverilog');
          setRunCmd(cfg.run_command || './a.out');
          setHiddenFiles(cfg.hidden || []);
          if (cfg.enable_args === true) {
            setSimArgs(cfg.default_args || data.files.map(f => f.name).join(' '));
          }
          setEnableArgs(cfg.enable_args !== false);
          setHideInstructions(!!cfg.hide_instructions);
          setAllowNewFiles(allowNew);
          setAllowRenameOriginalFiles(cfg.allow_rename_original_files === true);
        });
    } else {
      setHideInstructions(true);
      fetch('/api/exercise/freeplay')
        .then(r => r.json())
        .then(data => {
          const cfg = data.config || {};
          const allowNew = cfg.allow_new_files === true;
          let loadedTabs = data.files.map(f => ({ ...f, userCreated: false }));
          if (allowNew) {
            const stored = localStorage.getItem('vercises-session-freeplay');
            if (stored) {
              try { loadedTabs = JSON.parse(stored).tabs; } catch (_) {}
            }
          }
          setTabs(loadedTabs);
          setActiveTab(0);
          setInstructions(data.instructions);
          setSimCmd(cfg.simulation_command || 'iverilog');
          setRunCmd(cfg.run_command || './a.out');
          setHiddenFiles(cfg.hidden || []);
          if (cfg.enable_args === true) {
            setSimArgs(cfg.default_args || data.files.map(f => f.name).join(' '));
          }
          setEnableArgs(cfg.enable_args !== false);
          setAllowNewFiles(allowNew);
          setAllowRenameOriginalFiles(cfg.allow_rename_original_files === true);
        });
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
    setPanelTab('output');
    if (data.vcd_content) {
      loadVcdIntoSurfer(data.vcd_content);
    }
    setTimeout(() => setOutputAnim(true), 10);
    setTimeout(() => setRunCooldown(false), 1000);
  }, [runCooldown, tabs, hiddenFiles, exercise, simCmd, simArgs, runCmd, enableArgs, surferReady]);

  // ── localStorage save ──────────────────────────────────────
  useEffect(() => {
    if (!allowNewFiles) return;
    const key = `vercises-session-${exercise ?? 'freeplay'}`;
    localStorage.setItem(key, JSON.stringify({ tabs }));
  }, [tabs, allowNewFiles, exercise]);

  // ── New-file tab handlers ─────────────────────────────────
  const handleAddTab = useCallback(() => {
    const newIdx = tabs.length;
    setTabs(prev => [...prev, { name: '', content: '', userCreated: true }]);
    setActiveTab(newIdx);
    setEditingTab(newIdx);
    setEditingIsNew(true);
    setEditingValue('');
  }, [tabs.length]);

  const handleDeleteTab = useCallback((i) => {
    setTabs(prev => prev.filter((_, idx) => idx !== i));
    setActiveTab(prev => (prev >= i && prev > 0 ? prev - 1 : prev));
  }, []);

  const handleBeginRename = useCallback((i) => {
    setEditingTab(i);
    setEditingIsNew(false);
    setEditingValue(tabs[i]?.name ?? '');
  }, [tabs]);

  const handleCommitEdit = useCallback(() => {
    const name = editingValue.trim();
    if (!name) {
      if (editingIsNew) {
        setTabs(prev => prev.filter((_, i) => i !== editingTab));
        setActiveTab(prev => Math.max(0, prev - 1));
      }
      setEditingTab(null);
      setEditingIsNew(false);
      setEditingValue('');
      return;
    }
    const isDuplicate = tabs.some((t, i) => i !== editingTab && t.name === name);
    if (isDuplicate) return;
    const oldName = tabs[editingTab]?.name;
    setTabs(prev => {
      const next = [...prev];
      next[editingTab] = { ...next[editingTab], name };
      return next;
    });
    if (oldName && oldName !== name) {
      setSimArgs(prev => prev.split(' ').map(arg => arg === oldName ? name : arg).join(' '));
    }
    setEditingTab(null);
    setEditingIsNew(false);
    setEditingValue('');
  }, [editingTab, editingIsNew, editingValue, tabs]);

  const handleCancelEdit = useCallback(() => {
    if (editingIsNew) {
      setTabs(prev => prev.filter((_, i) => i !== editingTab));
      setActiveTab(prev => Math.max(0, prev - 1));
    }
    setEditingTab(null);
    setEditingIsNew(false);
    setEditingValue('');
  }, [editingTab, editingIsNew]);

  const handleClosePanel = () => {
    setSimOpen(false);
    setTimeout(() => setSimMounted(false), 260);
  };

  // ── Divider drag (horizontal) ──────────────────────────────
  useEffect(() => {
    const onMove = e => {
      if (dragging.current) {
        const cw = containerRef.current?.offsetWidth || window.innerWidth;
        setDividerX(Math.max(260, Math.min(e.clientX, cw - 300)));
      }
      if (panelDragging.current) {
        const rp = rightPaneRef.current;
        if (!rp) return;
        const rpRect = rp.getBoundingClientRect();
        const newH = rpRect.bottom - e.clientY;
        const minH = 120;
        const maxH = rpRect.height - 60;
        setPanelHeight(Math.max(minH, Math.min(newH, maxH)));
      }
    };
    const onUp = () => {
      dragging.current     = false;
      panelDragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  const startPanelDrag = () => {
    panelDragging.current = true;
    document.body.style.cursor     = 'ns-resize';
    document.body.style.userSelect = 'none';
  };

  const exerciseLabel = exercise
    ? exercise.charAt(0).toUpperCase() + exercise.slice(1)
    : 'Freeplay';

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

        <div className="flex items-center gap-3">
        <a
          href="https://lawrence-lugs.github.io/Vercises/"
          target="_blank"
          rel="noreferrer"
          className="text-[#616161] hover:text-[#6B0D1A] text-sm transition-colors"
          title="Documentation"
        >
          Docs ↗
        </a>
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
        </div>
      </header>

      {/* ── Main split area ──────────────────────────────────── */}
      <div ref={containerRef} className="flex flex-1 relative overflow-hidden">

        {/* Left: Instructions */}
        {!hideInstructions && (
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
        )}

        {/* Vertical divider */}
        {!hideInstructions && (
          <div
            className="w-1.5 shrink-0 bg-[#dee2e6] hover:bg-[#A52033] cursor-col-resize transition-colors z-10"
            onMouseDown={() => { dragging.current = true; }}
          />
        )}

        {/* Right: Editor + slide-up sim panel */}
        <div ref={rightPaneRef} className="flex flex-col flex-1 h-full bg-[#f8f9fa] overflow-hidden relative">

          {/* Tab bar */}
          <div className="flex bg-white border-b border-[#dee2e6] shrink-0 items-stretch">
            {tabs.map((tab, i) => {
              if (editingTab === i) {
                return (
                  <input
                    key={`tab-input-${i}`}
                    autoFocus
                    value={editingValue}
                    onChange={e => setEditingValue(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter')  { editingActionRef.current = true; handleCommitEdit(); }
                      if (e.key === 'Escape') { editingActionRef.current = true; handleCancelEdit(); }
                    }}
                    onBlur={() => {
                      if (editingActionRef.current) { editingActionRef.current = false; return; }
                      handleCommitEdit();
                    }}
                    className="px-3 py-2.5 text-sm font-medium font-mono border-b-2 border-[#6B0D1A] text-[#6B0D1A] bg-white focus:outline-none w-32 min-w-[80px]"
                    spellCheck={false}
                    placeholder="filename.v"
                  />
                );
              }
              return (
                <button
                  key={tab.name || `tab-${i}`}
                  onClick={() => setActiveTab(i)}
                  onDoubleClick={() => (tab.userCreated || allowRenameOriginalFiles) && handleBeginRename(i)}
                  className={[
                    'group flex items-center gap-1 px-4 py-2.5 text-sm font-medium transition-colors focus:outline-none whitespace-nowrap',
                    i === activeTab
                      ? 'border-b-2 border-[#6B0D1A] text-[#6B0D1A] bg-white'
                      : 'text-[#616161] hover:text-gray-800 hover:bg-gray-50',
                  ].join(' ')}
                >
                  {tab.name}
                  {tab.userCreated && (
                    <span
                      role="button"
                      onClick={e => { e.stopPropagation(); handleDeleteTab(i); }}
                      className="ml-1 text-[#616161] hover:text-[#6B0D1A] text-base leading-none opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label={`Close ${tab.name}`}
                    >
                      ×
                    </span>
                  )}
                </button>
              );
            })}
            {allowNewFiles && (
              <button
                onClick={handleAddTab}
                disabled={editingTab !== null}
                className="px-3 py-2.5 text-sm text-[#616161] hover:text-[#6B0D1A] hover:bg-gray-50 transition-colors focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="New file"
                title="New file"
              >
                +
              </button>
            )}
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

          {/* Simulation panel — always in the DOM so the Surfer WASM stays loaded */}
          <SimulationPanel
            open={simOpen}
            mounted={simMounted}
            onClose={handleClosePanel}
            isRunning={isRunning}
            simCmd={simCmd}
            runCmd={runCmd}
            enableArgs={enableArgs}
            simArgs={simArgs}
            onSimArgsChange={setSimArgs}
            output={output}
            outputAnim={outputAnim}
            panelTab={panelTab}
            onPanelTabChange={setPanelTab}
            surferRef={surferRef}
            panelHeight={panelHeight}
            onPanelDragStart={startPanelDrag}
          />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Simulation slide-up panel (absolute inside right column)
// ─────────────────────────────────────────────────────────────
function SimulationPanel({
  open, mounted, onClose, isRunning,
  simCmd, runCmd, enableArgs, simArgs, onSimArgsChange,
  output, outputAnim,
  panelTab, onPanelTabChange,
  surferRef,
  panelHeight, onPanelDragStart,
}) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setAnimated(open));
    return () => cancelAnimationFrame(id);
  }, [open]);

  const visible = animated && open;

  // panelHeight null → use CSS default (42%); otherwise use explicit px height.
  // When not visible, height collapses to 0 so Monaco's flex-1 area is never hidden.
  const heightStyle = !visible
    ? { height: 0 }
    : panelHeight != null
      ? { height: panelHeight, minHeight: 120, maxHeight: '90%' }
      : { height: '42%', minHeight: '180px', maxHeight: '58%' };

  return (
    <div
      className={[
        'shrink-0 overflow-hidden',
        panelHeight == null ? 'transition-[height] duration-[260ms] ease-[cubic-bezier(0.4,0,0.2,1)]' : '',
      ].join(' ')}
      style={heightStyle}
    >
    {/* Inner container carries the visual styling and relative ctx for drag handle */}
    <div className="relative h-full flex flex-col bg-white border-t-2 border-[#6B0D1A] shadow-[0_-4px_20px_rgba(107,13,26,0.10)]">
      {/* Drag handle — grab to resize panel height */}
      <div
        onMouseDown={onPanelDragStart}
        className="absolute top-0 left-0 right-0 h-1.5 cursor-ns-resize bg-transparent hover:bg-[#A52033] transition-colors z-10"
        title="Drag to resize"
      />
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

      {/* Tab bar */}
      <div className="flex border-b border-[#dee2e6] shrink-0 bg-white text-xs">
        <button
          onClick={() => onPanelTabChange('output')}
          className={[
            'px-4 py-1.5 font-medium transition-colors',
            panelTab === 'output'
              ? 'border-b-2 border-[#6B0D1A] text-[#6B0D1A]'
              : 'text-[#616161] hover:text-gray-800',
          ].join(' ')}
        >
          Output
        </button>
        <button
          onClick={() => onPanelTabChange('waveform')}
          className={[
            'px-4 py-1.5 font-medium transition-colors',
            panelTab === 'waveform'
              ? 'border-b-2 border-[#6B0D1A] text-[#6B0D1A]'
              : 'text-[#616161] hover:text-gray-800',
          ].join(' ')}
        >
          Waveform
        </button>
      </div>

      {/* Output tab content */}
      <div className={['flex-1 overflow-y-auto bg-[#f8f9fa] p-4', panelTab === 'output' ? 'block' : 'hidden'].join(' ')}>
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

      {/* Waveform tab — iframe is always in the DOM; CSS hides it when not active */}
      <div
        className="flex-1 overflow-hidden"
        style={{ display: panelTab === 'waveform' ? 'block' : 'none' }}
      >
        <iframe
          ref={surferRef}
          src="/exercises/surfer/index.html"
          title="Waveform Viewer"
          className="w-full h-full border-none"
          sandbox="allow-scripts allow-same-origin"
        />
      </div>
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
