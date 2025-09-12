`timescale 1ns/1ps
module tb_stack;
	reg clk, nrst, push, pop;
	reg [3:0] din;
	wire [3:0] dout;

	stack uut (
		.clk(clk),
		.nrst(nrst),
		.push(push),
		.pop(pop),
		.din(din),
		.dout(dout)
	);

	// Clock generation
	initial clk = 0;
	always #5 clk = ~clk;

    reg [3:0] push_values [0:3];
    integer err;

    // Waveform dump
    initial begin
        $dumpfile("tb_stack.vcd");
        $dumpvars(0, tb_stack);
    end

	initial begin
		$display("Starting stack testbench...");
		nrst = 0; push = 0; pop = 0; din = 0;
		#12;
		nrst = 1;
		#10;

        push_values[0] = 4'd3;
        push_values[1] = 4'd7;
        push_values[2] = 4'd12;
        push_values[3] = 4'd15;

		// Push 4 values
		for (integer i = 0; i < 4; i = i + 1) begin
			@(negedge clk);
			push = 1; 
            pop = 0; 
            din = push_values[i];
			$display("Pushing %d", din);
			@(negedge clk);
			push = 0;
			#2;
		end

        #10;

		// Pop 4 values
		for (integer i = 0; i < 4; i = i + 1) begin
			@(negedge clk);
			push = 0; 
            pop = 1;
			@(negedge clk);
			pop = 0;
			#2;
            if (dout !== 4'bxxxx)
                if (dout == push_values[3 - i])
                    $display("Popped value: %d (correct)", dout);
                else
                    $display("Popped value: %d (incorrect, expected %d)", dout, push_values[3 - i]);
            else
                $display("Popped value: Invalid (stack underflow)");
		end

		#10;
		$finish;
	end
endmodule
