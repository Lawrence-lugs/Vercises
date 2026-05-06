`timescale 1ns/1ps

module tb_freeplay;

    // Declare signals here

    // Instantiate your module
    // freeplay uut (
    //     .port(signal),
    // );

    initial begin
        $dumpfile("tb_freeplay.vcd");
        $dumpvars(0, tb_freeplay);

        // Add your test stimulus here

        $finish;
    end

endmodule
