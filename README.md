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
1. Clone the repository
   ```sh
   git clone https://github.com/Lawrence-lugs/Vercises.git
   ```
2. Build and run the Docker container:
   ```sh
   docker-compose build
   docker-compose up
   ```
3. Open [http://localhost/exercises](http://localhost/exercises) in your browser.
4. Choose an exercise.

## Adding Exercises

1. Make a folder with the name of your new exercise
2. Add verilog files into `exercises/<exercisename>`
3. Add an `instructions.md` (markdown file containing the exercise instructions)

The app should immediately be able to detect this new exercise.

## Notes

- Always put in the images in the same folder as `instructions.md` if you want to add images.