import React, { useState, useRef, useEffect } from 'react';
import './App.css';
import MonacoEditor from '@monaco-editor/react';
import ReactMarkdown from 'react-markdown';

function getExerciseFromPath() {
  console.log('Trying to get exercise from current path:', window.location.pathname);
  const match = window.location.pathname.match(/^\/exercises\/([^\/]+)/);

  // If cannot match, log it
  if (!match) {
    console.error('!!! No exercise found for path:', window.location.pathname);
  } else {
    console.log('!!! Loaded exercise:', match[1]);
  }

  return match ? match[1] : null;
}

export default function App() {
  const [runCooldown, setRunCooldown] = useState(false);
  const [tabs, setTabs] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [instructions, setInstructions] = useState('');
  const [simArgs, setSimArgs] = useState('');
  const [output, setOutput] = useState('');
  const [dividerX, setDividerX] = useState(window.innerWidth * 0.5);
  const [dividerY, setDividerY] = useState(window.innerHeight * 0.6);
  const [outputAnim, setOutputAnim] = useState(false);
  const [simCmd, setSimCmd] = useState('');
  const [runCmd, setRunCmd] = useState('');
  const [hiddenFiles, setHiddenFiles] = useState([]);
  const [enableArgs, setEnableArgs] = useState(true);
  const dragging = useRef(false);
  const draggingY = useRef(false);

  // Simple client-side routing for /exercises
  const pathname = window.location.pathname;
  if (pathname === '/exercises') {
    return <ExercisesList />;
  }

  // Load exercise content on mount or route change
  useEffect(() => {
    const exercise = getExerciseFromPath();
    if (exercise) {
      fetch(`/api/exercise/${exercise}`)
        .then(res => res.json())
        .then(data => {
          setTabs(data.files);
          setActiveTab(0);
          setInstructions(data.instructions);
          setSimCmd(data.simCommand || '');
          setRunCmd(data.runCommand || '');
          setHiddenFiles(data.hiddenFiles || []);
          if (data.defArgs && data.enableArgs !== false) {
            setSimArgs(data.defArgs);
          } else {
            // Set simargs to all files 
            setSimArgs(data.files.map(f => f.name).join(' '));
          }
          setEnableArgs(data.enableArgs !== false); // default true if not provided
        });
    } else {
      // fallback demo
      setTabs([
        { name: 'alu.v', content: '// Verilog code for ALU\nmodule alu(...);\nendmodule' },
        { name: 'tb_alu.v', content: '// Testbench for ALU\nmodule tb_alu(...);\nendmodule' },
      ]);
      setActiveTab(0);
      setInstructions(`# Build an ALU\n\nDesign an ALU that supports add, subtract, and, or operations.\n\n## Specs\n- Inputs: a, b, op\n- Outputs: result\n`);
      setSimCmd('iverilog');
      setRunCmd('./a.out');
      setHiddenFiles([]);
      setSimArgs('tb_alu.v alu.v');
      setEnableArgs(true);
    }
  }, [window.location.pathname]);

  const handleRun = async () => {
    if (runCooldown) return;
    setRunCooldown(true);
    const files = tabs.map(tab => ({ name: tab.name, content: tab.content }));
    // Fetch hidden files content if any
    if (hiddenFiles.length > 0) {
      const exercise = getExerciseFromPath();
      const hiddenFileContents = await Promise.all(hiddenFiles.map(async fname => {
        const res = await fetch(`/exercises/${exercise}/${fname}`);
        const content = await res.text();
        return { name: fname, content };
      }));
      files.push(...hiddenFileContents);
    }
    const simCmdFull = `${simCmd} ${simArgs}`;
    const res = await fetch('/api/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ files, simCmd: simCmdFull, runCmd }),
    });
    const data = await res.json();
    setOutputAnim(false); // reset animation
    setOutput(data.output);
    setTimeout(() => setOutputAnim(true), 10); // trigger animation
    setTimeout(() => setRunCooldown(false), 1000); // 1 second cooldown
  };

  // Divider drag logic
  const handleMouseDownX = () => { dragging.current = 'x'; };
  const handleMouseDownY = () => { dragging.current = 'y'; };
  const handleMouseUp = () => { dragging.current = false; };
  const handleMouseMove = e => {
    if (dragging.current === 'x') {
      setDividerX(Math.max(200, Math.min(e.clientX, window.innerWidth - 400)));
    }
    if (dragging.current === 'y') {
      setDividerY(Math.max(200, Math.min(e.clientY, window.innerHeight - 200)));
    }
  };
  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  });

  return (
    <div className="app-container" style={{ position: 'relative', height: '100vh', width: '100vw' }}>
      {/* Editor panel (left half) */}
      <div className="editor-pane" style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: dividerX }}>
        <div className="tab-bar">
          {tabs.map((tab, i) => (
            <button
              key={tab.name}
              className={`tab-btn${i === activeTab ? ' active' : ''}`}
              onClick={() => setActiveTab(i)}
            >{tab.name}</button>
          ))}
        </div>
        {tabs.length > 0 && (
          <MonacoEditor
            height="100%"
            theme="vs-dark"
            language="verilog"
            value={tabs[activeTab].content}
            options={{ fontFamily: 'Cascadia Code, Fira Mono, monospace', fontSize: 16, minimap: { enabled: true } }}
            onChange={val => {
              const newTabs = [...tabs];
              newTabs[activeTab].content = val;
              setTabs(newTabs);
            }}
          />
        )}
      </div>
      {/* Vertical divider between editor and right panels */}
      <div
        className="divider"
        style={{ left: dividerX - 3, top: 0, bottom: 0, width: '6px', cursor: 'col-resize', position: 'absolute', background: '#2c2c32', zIndex: 10 }}
        onMouseDown={handleMouseDownX}
      />
      {/* Instructions panel (top right) */}
      <div className="instructions-pane" style={{ position: 'absolute', left: dividerX, top: 0, width: `calc(100vw - ${dividerX}px)`, height: dividerY, overflow: 'auto', background: '#23272e', color: '#d4d4d4' }}>
        <div className="instructions-markdown" style={{ height: '100%', overflowY: 'auto', padding: '60px' }}>
          <ReactMarkdown
            components={{
              h1: ({node, ...props}) => <h1 className="md-h1" {...props} />,
              h2: ({node, ...props}) => <h2 className="md-h2" {...props} />,
              h3: ({node, ...props}) => <h3 className="md-h3" {...props} />,
              p: ({node, ...props}) => <p className="md-p" {...props} />,
              li: ({node, ...props}) => <li className="md-li" {...props} />,
              code: ({node, ...props}) => <code className="md-code" {...props} />,
              img: ({node, ...props}) => {
                  const exercise = getExerciseFromPath();
                  let src = props.src;
                  console.log('Rendering image with original src:', src);
                  if (!src.startsWith('/')) {
                      src = `/exercises/${exercise}/${src}`;
                  }
                  return <img {...props} src={src} style={{ maxWidth: '100%', height: 'auto', maxHeight: '100%' }} />;
              }
            }}
          >{instructions}</ReactMarkdown>
        </div>
      </div>
      {/* Horizontal divider between instructions and simulation */}
      <div
        className="divider"
        style={{ left: dividerX, top: dividerY - 3, width: `calc(100vw - ${dividerX}px)`, height: '6px', cursor: 'row-resize', position: 'absolute', background: '#2c2c32', zIndex: 10 }}
        onMouseDown={handleMouseDownY}
      />
      {/* Simulation panel (bottom right) */}
      <div className="instructions-bg" style={{ position: 'absolute', left: dividerX, top: dividerY, width: `calc(100vw - ${dividerX}px)`, height: `calc(100vh - ${dividerY}px)`, overflowY: 'auto', background: '#302f2fff', color: '#d4d4d4', padding: '24px' }}>
        <h1 className="md-h1">Simulation</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontFamily: 'monospace', background: '#222', padding: '4px 8px', borderRadius: '4px' }}>{simCmd}</span>
          {enableArgs && (
            <input
              value={simArgs}
              onChange={e => setSimArgs(e.target.value)}
              className="sim-input"
              style={{ flex: 1 }}
            />
          )}
          <span style={{ fontFamily: 'monospace', background: '#222', padding: '4px 8px', borderRadius: '4px' }}>{runCmd}</span>
        </div>
        <button onClick={handleRun} className="run-btn" disabled={runCooldown} style={runCooldown ? { opacity: 0.6, cursor: 'not-allowed' } : {}}>Run</button>
        <div className="output-box">
          <h3 className="output-title">Output</h3>
          <pre className={`output-pre${outputAnim ? ' output-anim' : ''}`}>{output}</pre>
        </div>
      </div>
    </div>
  );
// List exercises component for /exercises route
function ExercisesList() {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/exercises')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch exercises');
        return res.json();
      })
      .then(data => {
        setExercises(data.exercises);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading exercises...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="exercises-zen-container">
      <div className="exercises-zen-list">
        <h1 className="md-h1 exercises-zen-title">Available Exercises</h1>
        <ul className="exercises-zen-ul">
          {exercises.map((ex, idx) => (
            <li key={idx} className="exercises-zen-li">
              <a
                href={`/exercises/${ex}`}
                className="exercises-zen-link"
              >{ex}</a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
}
