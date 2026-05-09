// A trivial combinational module used as the fixture for the "hello world" exercise.
// The testbench (tb_hello_world.v) is hidden from the editor; it generates a VCD dump
// so that the waveform E2E test can verify the Surfer panel opens.
module hello_world(
  input  wire a,
  input  wire b,
  output wire y
);
  assign y = a & b;
endmodule
