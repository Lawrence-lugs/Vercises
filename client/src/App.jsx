
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
  // Colors now in CSS

  return (
      <div className="app-container">
        <div className="editor-pane" style={{ width: dividerX }}>
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
              options={{ fontFamily: 'Cascadia Code, Fira Mono, monospace', fontSize: 16, minimap: { enabled: false } }}
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
          className="divider"
          style={{ left: dividerX - 3 }}
          onMouseDown={handleMouseDown}
        />
        <div className="instructions-pane" style={{ left: dividerX }}>
          <h2 className="instructions-title">Instructions</h2>
          <div className="instructions-markdown">
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
          <h3 className="sim-title">Simulation Command</h3>
          <input
            value={simCmd}
            onChange={e => setSimCmd(e.target.value)}
            className="sim-input"
          />
          <button onClick={handleRun} className="run-btn">Run</button>
          <h3 className="output-title">Output</h3>
          <pre className="output-pre">{output}</pre>
        </div>
      </div>
  );
}
