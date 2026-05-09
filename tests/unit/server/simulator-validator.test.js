import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  validateSimCmd,
  validateRunCmd,
  SIM_CMD_WHITELIST,
  RUN_CMD_WHITELIST,
} from '../../../server/simulator.js';

// Mock dockerode so importing simulator.js never tries to open the Docker socket.
// Uses __mocks__/dockerode.js as the implementation.
vi.mock('dockerode');

describe('validateSimCmd', () => {
  it('accepts every command in SIM_CMD_WHITELIST', () => {
    for (const cmd of SIM_CMD_WHITELIST) {
      expect(() => validateSimCmd(cmd)).not.toThrow();
      expect(() => validateSimCmd(`${cmd} -o a.out tb.v design.v`)).not.toThrow();
    }
  });

  it('rejects a command not in the whitelist', () => {
    const blocked = ['bash', 'sh', 'python3', 'nc', '../evil', 'curl'];
    for (const cmd of blocked) {
      expect(() => validateSimCmd(cmd)).toThrow();
      expect(() => validateSimCmd(cmd)).toThrow(expect.objectContaining({ status: 400 }));
    }
  });

  it('rejects a whitelisted binary with a path prefix', () => {
    // "/usr/bin/iverilog" must not bypass the whitelist check
    expect(() => validateSimCmd('/usr/bin/iverilog')).toThrow();
    expect(() => validateSimCmd('../iverilog')).toThrow();
  });

  it('is a no-op for falsy values', () => {
    expect(() => validateSimCmd(null)).not.toThrow();
    expect(() => validateSimCmd(undefined)).not.toThrow();
    expect(() => validateSimCmd('')).not.toThrow();
  });

  it('handles leading/trailing whitespace', () => {
    expect(() => validateSimCmd(`  ${SIM_CMD_WHITELIST[0]}  `)).not.toThrow();
  });
});

describe('validateRunCmd', () => {
  it('accepts every command in RUN_CMD_WHITELIST', () => {
    for (const cmd of RUN_CMD_WHITELIST) {
      expect(() => validateRunCmd(cmd)).not.toThrow();
      expect(() => validateRunCmd(`${cmd} a.out`)).not.toThrow();
    }
  });

  it('rejects ./a.out (noexec path)', () => {
    expect(() => validateRunCmd('./a.out')).toThrow();
    expect(() => validateRunCmd('./a.out')).toThrow(expect.objectContaining({ status: 400 }));
  });

  it('rejects shell commands', () => {
    const blocked = ['bash', 'sh', '/bin/sh', 'python3', 'node'];
    for (const cmd of blocked) {
      expect(() => validateRunCmd(cmd)).toThrow(expect.objectContaining({ status: 400 }));
    }
  });

  it('is a no-op for falsy values', () => {
    expect(() => validateRunCmd(null)).not.toThrow();
    expect(() => validateRunCmd(undefined)).not.toThrow();
    expect(() => validateRunCmd('')).not.toThrow();
  });
});

describe('whitelist shape', () => {
  it('SIM_CMD_WHITELIST is a non-empty array of strings', () => {
    expect(Array.isArray(SIM_CMD_WHITELIST)).toBe(true);
    expect(SIM_CMD_WHITELIST.length).toBeGreaterThan(0);
    SIM_CMD_WHITELIST.forEach((cmd) => expect(typeof cmd).toBe('string'));
  });

  it('RUN_CMD_WHITELIST is a non-empty array of strings', () => {
    expect(Array.isArray(RUN_CMD_WHITELIST)).toBe(true);
    expect(RUN_CMD_WHITELIST.length).toBeGreaterThan(0);
    RUN_CMD_WHITELIST.forEach((cmd) => expect(typeof cmd).toBe('string'));
  });
});
