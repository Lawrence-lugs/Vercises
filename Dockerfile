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

# Build React app
RUN cd client && npm run build

# Expose port 80
EXPOSE 80

# Start server (serves React build and API)
CMD ["node", "server/index.js"]
