import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import listExercises from '../../../server/listExercises.js';

describe('listExercises', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'vercises-test-'));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns directory names from the given exercises dir', () => {
    mkdirSync(join(tmpDir, 'alu'));
    mkdirSync(join(tmpDir, 'lfsr'));
    mkdirSync(join(tmpDir, 'stack'));
    writeFileSync(join(tmpDir, 'readme.md'), '');

    const result = listExercises(tmpDir);
    expect(result).toEqual(expect.arrayContaining(['alu', 'lfsr', 'stack']));
    expect(result).not.toContain('readme.md');
  });

  it('returns an empty array when the exercises dir does not exist', () => {
    const result = listExercises('/absolutely/does/not/exist/xyz');
    expect(result).toEqual([]);
  });

  it('returns an empty array when the exercises dir is empty', () => {
    const result = listExercises(tmpDir);
    expect(result).toEqual([]);
  });

  it('ignores files at the root of the exercises directory', () => {
    mkdirSync(join(tmpDir, 'exercise_a'));
    writeFileSync(join(tmpDir, '.gitkeep'), '');
    writeFileSync(join(tmpDir, 'README.md'), '');

    const result = listExercises(tmpDir);
    expect(result).toEqual(['exercise_a']);
  });
});
