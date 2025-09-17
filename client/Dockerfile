FROM node:20-bullseye

COPY . /app/client

WORKDIR /app/client
# Install dependencies only (source code will be mounted by docker-compose)
COPY package*.json ./
RUN npm install

WORKDIR /app/vaporview
# Install build dependencies for vaporview
RUN apt-get update && apt-get install -y curl build-essential pkg-config libssl-dev

# Install Rust and wasm-pack
RUN curl https://sh.rustup.rs -sSf | sh -s -- -y
ENV PATH="/root/.cargo/bin:$PATH"

# Install vaporview dependencies and build webview
COPY ../vaporview/package*.json ./
RUN npm install
COPY ../vaporview ./

# Add wasm32 target for Rust
RUN cargo update
RUN cargo install wasm-tools
RUN rustup target add wasm32-unknown-unknown
RUN cargo build --target wasm32-unknown-unknown --release

# Build vaporview webview
RUN npm run build
RUN npx tsc -b

WORKDIR /app/client
# Copy vaporview webview build output to client public folder
RUN mkdir -p public/vaporview && cp -r /app/vaporview/dist/* public/vaporview/

EXPOSE 5173
CMD ["npm", "run", "dev"]
