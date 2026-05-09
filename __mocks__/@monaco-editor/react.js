// Manual mock for @monaco-editor/react.
// The real editor doesn't work in jsdom (no WebWorkers, no canvas).
// This stub renders nothing so tests can still mount components that contain the editor.
export default function MockMonacoEditor() {
  return null;
}
