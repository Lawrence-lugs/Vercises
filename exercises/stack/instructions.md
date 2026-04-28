# Lab: Implementation and Verification of a 4-Entry Stack

Design and implement a synchronous LIFO stack in Verilog. The stack has a depth of 4 entries, each 4 bits wide. It operates on the positive edge of `clk` and supports an asynchronous active-low reset (`nrst`).

The stack exposes a `push` signal to write `din` onto the top of the stack and a `pop` signal to remove the top entry and present it on `dout`. Push is ignored when the stack is full; pop is ignored when the stack is empty. You can verify your work with the provided testbench.

Special Note: In this lab, the complete simulation command syntax is not provided. You *must* provide the **source file** names manually in the blanks in the `SIMULATION` pane.