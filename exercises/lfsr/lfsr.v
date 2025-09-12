module lfsr (
    input wire clk,
    input wire nrst,
    output reg [3:0] lfsr
);
    always @(posedge clk or negedge nrst) begin
        if (!nrst)
            lfsr <= 4'b0001; // Non-zero seed
        else begin
            lfsr[0] <= lfsr[3];
            lfsr[1] <= lfsr[0];
            lfsr[2] <= lfsr[1] ^ lfsr[3];
            lfsr[3] <= lfsr[2];
        end
    end
endmodule