`timescale 1ns/1ps
module tb_hello_world;
  reg  a, b;
  wire y;

  hello_world dut(.a(a), .b(b), .y(y));

  initial begin
    $dumpfile("dump.vcd");
    $dumpvars(0, tb_hello_world);

    a = 0; b = 0; #10;
    a = 1; b = 0; #10;
    a = 1; b = 1; #10;
    a = 0; b = 1; #10;
    $finish;
  end
endmodule
