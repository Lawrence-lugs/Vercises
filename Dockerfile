# Exercism Clone Dockerfile
FROM node:20-bullseye

# Install Verilog simulators
RUN apt-get update && \
    apt-get install -y iverilog verilator && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy client and server code
COPY client ./client
COPY server ./server

# Install dependencies
RUN cd client && npm install && cd ../server && npm install

# Expose dev ports
EXPOSE 5173
EXPOSE 3000

# Default command will be overridden by docker-compose
CMD ["sleep", "infinity"]
