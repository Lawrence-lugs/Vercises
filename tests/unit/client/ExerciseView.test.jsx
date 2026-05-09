import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ExerciseView } from '../../../client/src/App.jsx';

// @monaco-editor/react is aliased to a no-op stub via vitest.client.config.js resolve.alias

// Set a stable pathname before each test
function setPath(path) {
  Object.defineProperty(window, 'location', {
    writable: true,
    value: { pathname: path },
  });
}

const makeExerciseResponse = (overrides = {}) => ({
  files: [{ name: 'design.v', content: 'module design; endmodule' }],
  instructions: '# Test Exercise\n\nImplement the module.',
  config: {
    simulation_command: 'iverilog',
    run_command: 'vvp a.out',
    enable_args: false,
    ...overrides,
  },
});

describe('ExerciseView', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    setPath('/exercises/hello_world');
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => makeExerciseResponse(),
    });
  });

  it('renders the editor area after loading an exercise', async () => {
    render(<ExerciseView />);
    // Wait for any file tab to appear — proves the exercise data loaded and the view rendered
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /design\.v/i })).toBeInTheDocument()
    );
  });

  it('renders instructions from markdown', async () => {
    render(<ExerciseView />);
    await waitFor(() => expect(screen.getByText(/Test Exercise/i)).toBeInTheDocument());
  });

  it('shows a tab for each visible file', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ...makeExerciseResponse(),
        files: [
          { name: 'design.v', content: '' },
          { name: 'helper.v', content: '' },
        ],
      }),
    });

    render(<ExerciseView />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /design\.v/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /helper\.v/i })).toBeInTheDocument();
    });
  });

  it('hides the args input when enable_args is false', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => makeExerciseResponse({ enable_args: false }),
    });

    render(<ExerciseView />);
    // Wait until exercise data loaded — design.v tab appears only after the fetch resolves
    await waitFor(() => screen.getByRole('button', { name: /design\.v/i }));

    // After the fetch, enableArgs should be false so the args input must not be in the DOM
    const argsInputs = screen.queryAllByRole('textbox').filter((el) => el.placeholder === '');
    expect(argsInputs).toHaveLength(0);
  });

  it('shows the Run button', async () => {
    render(<ExerciseView />);
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /run/i })).toBeInTheDocument()
    );
  });
});
