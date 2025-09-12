import React, { useState, useRef, useEffect } from 'react';
import MonacoEditor from '@monaco-editor/react';
import ReactMarkdown from 'react-markdown';

function getExerciseFromPath() {
  const match = window.location.pathname.match(/^\/exercises\/([^\/]+)/);

  // If cannot match, log it
  console.error('No exercise found for path:', window.location.pathname);

  return match ? match[1] : null;
}

export default function App() {
  const [tabs, setTabs] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [instructions, setInstructions] = useState('');
  const [simCmd, setSimCmd] = useState('');
  const [output, setOutput] = useState('');
  const [dividerX, setDividerX] = useState(window.innerWidth / 2);
  const dragging = useRef(false);

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
          // Default simulation command: iverilog <all .v files>
          const vfiles = data.files.filter(f => f.name.endsWith('.v')).map(f => f.name).join(' ');
          setSimCmd(vfiles ? `iverilog ${vfiles}` : '');
        });
    } else {
      // fallback demo
      setTabs([
        { name: 'alu.v', content: '// Verilog code for ALU\nmodule alu(...);\nendmodule' },
        { name: 'tb_alu.v', content: '// Testbench for ALU\nmodule tb_alu(...);\nendmodule' },
      ]);
      setActiveTab(0);
      setInstructions(`# Build an ALU\n\nDesign an ALU that supports add, subtract, and, or operations.\n\n## Specs\n- Inputs: a, b, op\n- Outputs: result\n`);
      setSimCmd('iverilog tb_alu.v alu.v');
    }
  }, [window.location.pathname]);

  const handleRun = async () => {
    const files = tabs.map(tab => ({ name: tab.name, content: tab.content }));
    const res = await fetch('/api/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ files, simCmd }),
    });
    const data = await res.json();
    setOutput(data.output);
  };

  // Divider drag logic
  const handleMouseDown = () => { dragging.current = true; };
  const handleMouseUp = () => { dragging.current = false; };
  const handleMouseMove = e => {
    if (dragging.current) {
      setDividerX(e.clientX);
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

  // VSCode dark theme colors
  const bg = '#1e1e1e';
  const border = '#2c2c32';
  const text = '#d4d4d4';
  const accent = '#007acc';

  return (
    <div style={{ height: '100vh', width: '100vw', background: bg, color: text, fontFamily: 'Segoe UI, sans-serif', display: 'flex', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: dividerX, display: 'flex', flexDirection: 'column', borderRight: `2px solid ${border}`, background: bg }}>
        <div style={{ display: 'flex', borderBottom: `1px solid ${border}` }}>
          {tabs.map((tab, i) => (
            <button key={tab.name} onClick={() => setActiveTab(i)} style={{
              fontWeight: i === activeTab ? 'bold' : 'normal',
              background: i === activeTab ? border : bg,
              color: text,
              border: 'none',
              borderBottom: i === activeTab ? `2px solid ${accent}` : 'none',
              padding: '8px 16px',
              cursor: 'pointer',
              outline: 'none',
              fontFamily: 'inherit',
            }}>{tab.name}</button>
          ))}
        </div>
        {tabs.length > 0 && (
          <MonacoEditor
            height="100%"
            theme="vs-dark"
            language="verilog"
            value={tabs[activeTab].content}
            options={{ fontFamily: 'Fira Mono, monospace', fontSize: 16, minimap: { enabled: false } }}
            onChange={val => {
              const newTabs = [...tabs];
              newTabs[activeTab].content = val;
              setTabs(newTabs);
            }}
          />
        )}
      </div>
      {/* Divider */}
      <div
        style={{ position: 'absolute', left: dividerX - 3, top: 0, bottom: 0, width: 6, cursor: 'col-resize', zIndex: 10, background: border }}
        onMouseDown={handleMouseDown}
      />
      <div style={{ position: 'absolute', left: dividerX, top: 0, bottom: 0, right: 0, padding: 24, overflowY: 'auto', background: bg, color: text }}>
        <h2 style={{ fontFamily: 'Segoe UI', color: accent }}>Instructions</h2>
        <div style={{ fontFamily: 'Segoe UI', fontSize: 18 }}>
          <ReactMarkdown
            components={{
              h1: ({node, ...props}) => <h1 style={{color: accent, fontFamily: 'Segoe UI'}} {...props} />,
              h2: ({node, ...props}) => <h2 style={{color: accent, fontFamily: 'Segoe UI'}} {...props} />,
              h3: ({node, ...props}) => <h3 style={{color: accent, fontFamily: 'Segoe UI'}} {...props} />,
              p: ({node, ...props}) => <p style={{fontFamily: 'Segoe UI'}} {...props} />,
              li: ({node, ...props}) => <li style={{fontFamily: 'Segoe UI'}} {...props} />,
              code: ({node, ...props}) => <code style={{background: '#252526', color: '#dcdcaa', padding: '2px 4px', borderRadius: 4, fontFamily: 'Fira Mono, monospace'}} {...props} />,
            }}
          >{instructions}</ReactMarkdown>
        </div>
        <h3 style={{ color: accent, marginTop: 32 }}>Simulation Command</h3>
        <input value={simCmd} onChange={e => setSimCmd(e.target.value)} style={{ width: '100%', background: border, color: text, border: `1px solid ${accent}`, fontFamily: 'Fira Mono, monospace', fontSize: 16, padding: 8, borderRadius: 4 }} />
        <button onClick={handleRun} style={{ marginTop: 12, background: accent, color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 4, fontFamily: 'Segoe UI', fontWeight: 'bold', cursor: 'pointer' }}>Run</button>
        <h3 style={{ color: accent, marginTop: 32 }}>Output</h3>
        <pre style={{ background: '#252526', color: '#dcdcaa', padding: 12, borderRadius: 4, fontFamily: 'Fira Mono, monospace', fontSize: 15 }}>{output}</pre>
      </div>
    </div>
  );
}
