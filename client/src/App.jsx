import React, { useState } from 'react';
import MonacoEditor from '@monaco-editor/react';
import ReactMarkdown from 'react-markdown';

const defaultTabs = [
  { name: 'alu.v', content: '// Verilog code for ALU\nmodule alu(...);\nendmodule' },
  { name: 'tb_alu.v', content: '// Testbench for ALU\nmodule tb_alu(...);\nendmodule' },
];

const defaultInstructions = `# Build an ALU\n\nDesign an ALU that supports add, subtract, and, or operations.\n\n## Specs\n- Inputs: a, b, op\n- Outputs: result\n`;

export default function App() {
  const [tabs, setTabs] = useState(defaultTabs);
  const [activeTab, setActiveTab] = useState(0);
  const [instructions, setInstructions] = useState(defaultInstructions);
  const [simCmd, setSimCmd] = useState('iverilog tb_alu.v alu.v');
  const [output, setOutput] = useState('');
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
  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <div style={{ flex: 1, borderRight: '1px solid #ccc', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid #ccc' }}>
          {tabs.map((tab, i) => (
            <button key={tab.name} onClick={() => setActiveTab(i)} style={{ fontWeight: i === activeTab ? 'bold' : 'normal' }}>{tab.name}</button>
          ))}
        </div>
        <MonacoEditor
          height="100%"
          language="verilog"
          value={tabs[activeTab].content}
          onChange={val => {
            const newTabs = [...tabs];
            newTabs[activeTab].content = val;
            setTabs(newTabs);
          }}
        />
      </div>
      <div style={{ flex: 1, padding: 24, overflowY: 'auto' }}>
        <h2>Instructions</h2>
        <ReactMarkdown>{instructions}</ReactMarkdown>
        <h3>Simulation Command</h3>
        <input value={simCmd} onChange={e => setSimCmd(e.target.value)} style={{ width: '100%' }} />
        <button onClick={handleRun} style={{ marginTop: 12 }}>Run</button>
        <h3>Output</h3>
        <pre style={{ background: '#222', color: '#fff', padding: 12 }}>{output}</pre>
      </div>
    </div>
  );
}
