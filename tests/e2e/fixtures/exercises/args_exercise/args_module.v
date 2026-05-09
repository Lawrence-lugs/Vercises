module args_module(
  input  wire clk,
  output reg  q
);
  always @(posedge clk) q <= ~q;
endmodule
