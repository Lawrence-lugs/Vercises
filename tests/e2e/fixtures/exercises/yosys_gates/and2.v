// Minimal combinational design for the yosys_gates fixture.
// Synthesized with yosys-then-ivlog; the gate-level netlist (netlist.v) is
// produced in the shared tmp dir and re-submitted on every subsequent run —
// that is the exact path that triggered the file-permission bug.
module and2 (
  input  wire a,
  input  wire b,
  output wire y
);
  assign y = a & b;
endmodule
