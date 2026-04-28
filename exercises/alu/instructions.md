# Lab: Implementation and Verification of a Structural 4-bit ALU

Design and implement a 4-bit Arithmetic Logic Unit (ALU) in Verilog using a structural design style. The provided component modules — adder, subtractor, bitwise operators, shifter, multiplexer, and zero-detector — are compiled alongside your design. Your task is to instantiate and interconnect them in `alu.v` to form the complete ALU.

The ALU takes two 4-bit operands `a` and `b` and a 3-bit `opcode`, and produces a 4-bit `result` and a `zero` flag. The `zero` flag is asserted whenever `result` equals zero. The operation performed is determined by the opcode as follows:


| `opcode` | Operation | Expression |
|----------|-----------|------------|
| `3'b000` | ADD       | `a + b` |
| `3'b001` | SUB       | `a - b` |
| `3'b010` | AND       | `a & b` |
| `3'b011` | XOR       | `a ^ b` |
| `3'b100` | SHIFT     | logical shift of `a`, amount and direction encoded in `b[1:0]` |


You can verify your work with the provided testbench.