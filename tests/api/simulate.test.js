import { describe, it, expect } from 'vitest';
import supertest from 'supertest';
import { SIM_CMD_WHITELIST, RUN_CMD_WHITELIST } from '../../server/simulator.js';

const api = supertest('http://localhost:3000');

// Pick the first whitelisted commands as defaults for tests that don't care about the specific command.
const DEFAULT_SIM_CMD = `${SIM_CMD_WHITELIST[0]} -o a.out hello_world.v`;
const DEFAULT_RUN_CMD = RUN_CMD_WHITELIST[0];

const HELLO_FILES = [
  { name: 'hello_world.v', content: 'module hello_world(input a, input b, output y); assign y = a & b; endmodule' },
  { name: 'tb_hello_world.v', content: '`timescale 1ns/1ps\nmodule tb; reg a,b; wire y; hello_world dut(.a(a),.b(b),.y(y)); initial begin a=0;b=0;#10;a=1;b=1;#10;$finish; end endmodule' },
];

// Build a simCmd that is definitely NOT in the whitelist (prefix "NOT_" ensures it never matches).
const INVALID_SIM_CMD = `NOT_${SIM_CMD_WHITELIST[0]} -o a.out hello_world.v`;
// Build a runCmd that is definitely NOT in the whitelist.
const INVALID_RUN_CMD = `NOT_${RUN_CMD_WHITELIST[0]}`;

describe('POST /api/simulate — command validation (no Docker needed)', () => {
  it('returns 400 when simCmd binary is not in the whitelist', async () => {
    const res = await api
      .post('/api/simulate')
      .send({ files: HELLO_FILES, simCmd: INVALID_SIM_CMD, runCmd: DEFAULT_RUN_CMD });
    expect(res.status).toBe(400);
  });

  it('returns 400 when runCmd binary is not in the whitelist', async () => {
    const res = await api
      .post('/api/simulate')
      .send({ files: HELLO_FILES, simCmd: DEFAULT_SIM_CMD, runCmd: INVALID_RUN_CMD });
    expect(res.status).toBe(400);
  });

  it('returns 400 when files is missing', async () => {
    const res = await api
      .post('/api/simulate')
      .send({ simCmd: DEFAULT_SIM_CMD, runCmd: DEFAULT_RUN_CMD });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/simulate — real Docker compilation', () => {
  it('returns 200 with output for valid Verilog', async () => {
    const res = await api.post('/api/simulate').send({
      files: HELLO_FILES,
      simCmd: `${SIM_CMD_WHITELIST[0]} -o a.out tb_hello_world.v hello_world.v`,
      runCmd: RUN_CMD_WHITELIST[0],
    });
    expect(res.status).toBe(200);
    expect(typeof res.body.output).toBe('string');
  });

  it('returns 200 with compile error output for broken Verilog', async () => {
    const brokenFiles = [
      { name: 'broken.v', content: 'module broken(input a, output y); assign y = ; endmodule' },
    ];
    const res = await api.post('/api/simulate').send({
      files: brokenFiles,
      simCmd: `${SIM_CMD_WHITELIST[0]} -o a.out broken.v`,
      runCmd: RUN_CMD_WHITELIST[0],
    });
    expect(res.status).toBe(200);
    // Compile errors go to output (non-zero exit from iverilog)
    expect(res.body.output.toLowerCase()).toMatch(/error|syntax/i);
  });
});
