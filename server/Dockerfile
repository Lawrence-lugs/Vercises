FROM node:20-bullseye

# Install Verilog simulators
RUN apt-get update && \
    apt-get install -y iverilog verilator && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

COPY . /app/server
WORKDIR /app/server

COPY package*.json ./
RUN npm install

EXPOSE 3000
CMD ["npx", "nodemon", "index.js"]
