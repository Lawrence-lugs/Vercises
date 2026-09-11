FROM node:20

WORKDIR /app/client
# Allow git to run in /app/client regardless of directory ownership (volume mount uid mismatch)
RUN git config --global --add safe.directory /app/client

# Build WASM surfer
RUN apt-get update && apt-get install -y --no-install-recommends git curl build-essential ca-certificates \
 && curl -fsSL https://github.com/trunk-rs/trunk/releases/latest/download/trunk-x86_64-unknown-linux-gnu.tar.gz | tar -xz -C /usr/local/bin \
 && curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --default-toolchain stable \
 && . "$HOME/.cargo/env" \
 && rustup target add wasm32-unknown-unknown \
 && git clone --branch v0.7.0 https://gitlab.com/surfer-project/surfer.git /tmp/surfer \
 && cd /tmp/surfer \
 && git submodule update --init --recursive \
 && . "$HOME/.cargo/env" && trunk build --release \
 && mkdir -p /app/surfer-static && cp -r dist/. /app/surfer-static/ \
 && sed -i 's|/\*SURFER_SETUP_HOOKS\*/|window.parent.postMessage({command:"surfer-loaded"},"*");|g' /app/surfer-static/index.html

# Install dependencies only (source code will be mounted by docker-compose)
COPY package*.json ./
RUN npm install

EXPOSE 5173
CMD ["npm", "run", "dev"]
