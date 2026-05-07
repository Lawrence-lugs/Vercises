FROM node:20-bullseye
# Install Verilog simulators + synthesis
RUN apt-get update && \
    apt-get install -y iverilog verilator yosys && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Install yosys-then-ivlog
COPY yosys-then-ivlog /usr/local/bin/yosys-then-ivlog
RUN chmod +x /usr/local/bin/yosys-then-ivlog

COPY . /app/server
WORKDIR /app/server
COPY package*.json ./
RUN npm install
EXPOSE 3000
CMD ["npx", "nodemon", "index.js"]