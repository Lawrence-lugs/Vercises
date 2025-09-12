# Vercises

An Exercism-like platform for Verilog coding exercises.

## Features
- Monaco editor (multi-tab) for Verilog code
- Markdown instructions for exercises
- Editable simulation command (e.g., `iverilog tb_alu.v alu.v`)
- Run button to execute Verilog simulation (using iverilog or verilator)
- Dockerized: includes Node.js, iverilog, verilator
- Accessible from [localhost](http://localhost) for Tailscale

## Usage
1. Build and run the Docker container:
   ```sh
   docker build -t vercises .
   docker run -p 80:80 vercises
   ```
2. Open [http://localhost](http://localhost) in your browser.
3. Edit code, instructions, and simulation command as needed. Click Run to simulate.

## Customization
- Add new exercises by editing the Markdown instructions and code tabs in the UI.
- Change simulation command to use `iverilog` or `verilator` as needed.

---

**Note:** This is a starter template. You can extend it with authentication, exercise management, and more as needed.
