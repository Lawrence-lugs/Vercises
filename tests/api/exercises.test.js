import { describe, it, expect } from 'vitest';
import supertest from 'supertest';

// Target the server started by docker-compose.test.yml in CI,
// or a locally running server in dev.
const api = supertest('http://localhost:3000');

describe('GET /api/exercises', () => {
  it('returns 200 with an exercises array', async () => {
    const res = await api.get('/api/exercises');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('exercises');
    expect(Array.isArray(res.body.exercises)).toBe(true);
  });

  it('returns only the four fixture exercises when using docker-compose.test.yml', async () => {
    const res = await api.get('/api/exercises');
    const names = res.body.exercises;
    // All fixture exercise names must be present
    const fixtures = ['hello_world', 'compile_error', 'args_exercise', 'sandbox'];
    for (const name of fixtures) {
      expect(names).toContain(name);
    }
    // No real exercises (alu, lfsr, stack) should leak through
    const realExercises = ['alu', 'lfsr', 'stack'];
    for (const name of realExercises) {
      expect(names).not.toContain(name);
    }
  });
});

describe('GET /api/exercise/:id', () => {
  it('returns 200 with files, instructions, and config for a known exercise', async () => {
    const res = await api.get('/api/exercise/hello_world');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.files)).toBe(true);
    expect(typeof res.body.instructions).toBe('string');
    expect(typeof res.body.config).toBe('object');
  });

  it('does not expose hidden files in the files array', async () => {
    const res = await api.get('/api/exercise/hello_world');
    const fileNames = res.body.files.map((f) => f.name);
    // tb_hello_world.v is in hidden[] per config.json
    expect(fileNames).not.toContain('tb_hello_world.v');
  });

  it('returns 404 for a non-existent exercise', async () => {
    const res = await api.get('/api/exercise/does_not_exist_xyz');
    expect(res.status).toBe(404);
  });
});
