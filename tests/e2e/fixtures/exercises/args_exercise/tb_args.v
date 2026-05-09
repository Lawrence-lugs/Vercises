`timescale 1ns/1ps
module tb_args;
  reg clk = 0;
  wire q;
  args_module dut(.clk(clk), .q(q));
  always #5 clk = ~clk;
  initial begin
    #100;
    $finish;
  end
endmodule
