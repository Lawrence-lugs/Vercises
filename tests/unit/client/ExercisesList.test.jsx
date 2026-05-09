import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExercisesList } from '../../../client/src/App.jsx';

// @monaco-editor/react is aliased to a no-op stub via vitest.client.config.js resolve.alias

const mockFetch = (data) =>
  vi.fn().mockResolvedValue({ ok: true, json: async () => data });

describe('ExercisesList', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders exercise cards after a successful fetch', async () => {
    global.fetch = mockFetch({ exercises: ['alu', 'lfsr', 'stack'] });

    render(<ExercisesList />);

    await waitFor(() => {
      // Each card renders the name as an <h2> heading inside the <a> link
      expect(screen.getByRole('heading', { name: /alu/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /lfsr/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /stack/i })).toBeInTheDocument();
    });
  });

  it('shows loading state initially', () => {
    global.fetch = vi.fn(() => new Promise(() => {})); // never resolves
    render(<ExercisesList />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('shows an error when fetch fails', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
    render(<ExercisesList />);
    await waitFor(() => expect(screen.getByText(/error/i)).toBeInTheDocument());
  });

  it('renders exercise links pointing to the correct href', async () => {
    global.fetch = mockFetch({ exercises: ['alu'] });
    render(<ExercisesList />);

    await waitFor(() => {
      const link = screen.getByRole('link', { name: /alu/i });
      expect(link).toHaveAttribute('href', '/exercises/alu');
    });
  });

  it('renders an empty list when no exercises exist', async () => {
    global.fetch = mockFetch({ exercises: [] });
    render(<ExercisesList />);
    await waitFor(() => {
      // The header always renders a nav link (/exercises); exercise cards link
      // to /exercises/{id} — check that no such deep links exist.
      const exerciseCardLinks = screen.queryAllByRole('link').filter(
        (el) => /\/exercises\/.+/.test(el.getAttribute('href'))
      );
      expect(exerciseCardLinks).toHaveLength(0);
    });
  });
});
