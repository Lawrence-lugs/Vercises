module adder_4bit (
    input  [3:0] a, b,
    output [3:0] sum
);

    assign sum = a + b;

endmodule

module subtractor_4bit (
    input  [3:0] a, b,
    output [3:0] diff
);

    assign diff = a - b;

endmodule

module and_4bit (
    input  [3:0] a, b,
    output [3:0] result
);
    assign result = a & b;
endmodule

module xor_4bit (
    input  [3:0] a, b,
    output [3:0] result
);
    assign result = a ^ b;
endmodule

module shift_4bit (
    input  [3:0] a,
    input  [3:0] shift_amt,
    output [3:0] result
);

    wire [1:0] shift_amt_2b = shift_amt[1:0];

    assign result = (shift_amt_2b == 2'b00) ? a :       // No shift
                    (shift_amt_2b == 2'b01) ? {a[2:0], 1'b0} : // Logical left shift by 1
                    (shift_amt_2b == 2'b10) ? {1'b0, a[3:1]} : // Logical right shift by 1
                    {a[2:0], 1'b0}; // Default to left shift by 1 (should not occur)
endmodule

module mux_4b_8to1 (
    input [3:0] in1,
    input [3:0] in2,
    input [3:0] in3,
    input [3:0] in4,
    input [3:0] in5,
    input  [2:0] sel,
    output [3:0] out
);
    assign out = (sel == 3'b000) ? in1 :
                 (sel == 3'b001) ? in2 :
                 (sel == 3'b010) ? in3 :
                 (sel == 3'b011) ? in4 :
                 (sel == 3'b100) ? in5 :
                 4'b0000; // Default case
endmodule

module is_zero_4b (
    input  [3:0] in,
    output out
);
    assign out = (in == 4'b0000);
endmodule

module mux2to1 (
    input  in0,
    input  in1,
    input  sel,
    output out
);
    assign out = sel ? in1 : in0;
endmodule