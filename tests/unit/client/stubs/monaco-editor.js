// Minimal stub for @monaco-editor/react used only in unit tests.
// resolve.alias in vitest.client.config.js redirects all imports of
// '@monaco-editor/react' here, so the real Monaco editor (which requires
// WebWorkers and canvas APIs absent in jsdom) never loads.
export default function MockMonacoEditor() {
  return null;
}
