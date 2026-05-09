// This file contains a deliberate syntax error to exercise the compile-error path.
module broken(
  input wire a,
  output wire y
);
  assign y = ;  // syntax error: missing RHS
endmodule
