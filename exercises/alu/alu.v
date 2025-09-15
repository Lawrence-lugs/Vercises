module ALU (
    input [3:0] a, b,
    input [2:0] opcode,
    output [3:0] result,
    output zero
);

    wire [3:0] sum, diff, and_res, xor_res, shift_res;
    wire cout_add, bout_sub;

    // Instantiate components
    adder_4bit u_adder (
        .a(a),
        .b(b),
        .sum(sum)
    );

    subtractor_4bit u_subtractor (
        .a(a),
        .b(b),
        .diff(diff)
    );

    and_4bit u_and (
        .a(a),
        .b(b),
        .result(and_res)
    );

    xor_4bit u_xor (
        .a(a),
        .b(b),
        .result(xor_res)
    );

    shift_4bit u_shift (
        .a(a),
        .shift_amt(b), // Use lower 2 bits of b as shift amount
        .result(shift_res)
    );

    mux_4b_8to1 u_mux (
        .in1(sum),
        .in2(diff),
        .in3(and_res),
        .in4(xor_res),
        .in5(shift_res),
        .sel(opcode),
        .out(result)
    );

    is_zero_4b u_is_zero (
        .in(result),
        .out(zero)
    );

endmodule