// Testbench for 4-bit Galois LFSR
`timescale 1ns/1ps

module tb_lfsr;
    reg clk;
    reg nrst;
    wire [3:0] lfsr;

    // Instantiate the LFSR module
    lfsr uut (
        .clk(clk),
        .nrst(nrst),
        .lfsr(lfsr)
    );

    reg [3:0] expected_seq [0:14];
    integer i, errors;
    initial begin
        $dumpfile("tb_lfsr.vcd");
        $dumpvars(0, tb_lfsr);
        clk = 0;
        nrst = 0;
        // Expected sequence for seed 4'b0001 and taps at 4,3 (x^4 + x^3 + 1)
        expected_seq[0]  = 4'b0010;
        expected_seq[1]  = 4'b0100;
        expected_seq[2]  = 4'b1000;
        expected_seq[3]  = 4'b0101;
        expected_seq[4]  = 4'b1010;
        expected_seq[5]  = 4'b0001;
        expected_seq[6]  = 4'b0010;
        expected_seq[7]  = 4'b0100;
        expected_seq[8]  = 4'b1000;
        expected_seq[9]  = 4'b0101;
        expected_seq[10] = 4'b1010;
        expected_seq[11] = 4'b0001;
        expected_seq[12] = 4'b0010;
        expected_seq[13] = 4'b0100;
        expected_seq[14] = 4'b1000;

        #5 nrst = 1;
        errors = 0;
        for (i = 0; i < 15; i = i + 1) begin
            #5 clk = ~clk;
            #5 clk = ~clk;
            $display("Cycle %0d: lfsr = %b, expected = %b", i, lfsr, expected_seq[i]);
            if (lfsr !== expected_seq[i]) begin
                $display("ERROR: Mismatch at cycle %0d!", i);
                errors = errors + 1;
            end
        end
        if (errors == 0)
            $display("PASS: LFSR matches expected sequence.");
        else
            $display("FAIL: %0d mismatches detected.", errors);
        $finish;
    end
endmodule
