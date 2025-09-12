FROM node:20-bullseye

# Install Verilog simulators
RUN apt-get update && \
    apt-get install -y iverilog verilator && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY . .

RUN npm install
EXPOSE 3000
CMD ["npm", "run", "dev"]
