module stack (
    input wire clk,
    input wire nrst,
    input wire push,
    input wire pop,
    input wire [3:0] din,
    output reg [3:0] dout
);
    reg [3:0] stack_mem [0:3]; // 4x4 stack memory
    reg [2:0] sp; // Stack pointer
    reg full, empty;

    // Initialize stack pointer and status flags
    initial begin
        sp = 2'b00;
        full = 1'b0;
        empty = 1'b1;
        dout = 4'b0000;
    end

    always @(posedge clk or negedge nrst) begin
        if (!nrst) begin
            // Asynchronous reset
            sp <= 2'b00;
            full <= 1'b0;
            empty <= 1'b1;
            dout <= 4'b0000;
        end else begin
            if (push && !full) begin
                // Push operation
                stack_mem[sp] <= din;
                sp <= sp + 1;
                empty <= 1'b0;
                if (sp == 3'b11) full <= 1'b1; // Stack is full after this push
            end else if (pop && !empty) begin
                // Pop operation
                sp <= sp - 1;
                dout <= stack_mem[sp - 1];
                full <= 1'b0;
                if (sp == 3'b01) empty <= 1'b1; // Stack is empty after this pop
            end
        end
    end
    
endmodule