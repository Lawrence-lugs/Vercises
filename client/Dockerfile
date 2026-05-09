FROM node:20-bullseye

COPY . /app/client

WORKDIR /app/client
# Allow git to run in /app/client regardless of directory ownership (volume mount uid mismatch)
RUN git config --global --add safe.directory /app/client
# Install dependencies only (source code will be mounted by docker-compose)
COPY package*.json ./
RUN npm install

# Download Surfer pre-compiled WASM build (pinned to v0.7.0)
# Stored outside the volume-mounted public/ so it survives the ./exercises volume override.
# The startup command (in docker-compose) copies it to public/surfer/ at runtime.
# Check https://gitlab.com/surfer-project/surfer/-/releases for newer tags.
RUN apt-get update && apt-get install -y --no-install-recommends unzip curl \
 && SURFER_TAG="v0.7.0" \
 && curl -fsSL \
      "https://gitlab.com/surfer-project/surfer/-/jobs/artifacts/${SURFER_TAG}/download?job=pages_build" \
      -o /tmp/surfer.zip \
 && mkdir -p /tmp/surfer-extracted \
 && unzip -q /tmp/surfer.zip -d /tmp/surfer-extracted \
 && echo "=== Extracted zip contents ===" && find /tmp/surfer-extracted -maxdepth 3 -type f | head -30 \
 && mkdir -p /app/surfer-static \
 && SURFER_IDX=$(find /tmp/surfer-extracted -name 'index.html' | head -1) \
 && SURFER_DIR=$(dirname "$SURFER_IDX") \
 && cp -r "$SURFER_DIR"/. /app/surfer-static/ \
 && sed -i \
      's|/\*SURFER_SETUP_HOOKS\*/|window.parent.postMessage({command:"surfer-loaded"},"*");|g' \
      /app/surfer-static/index.html \
 && rm -rf /tmp/surfer.zip /tmp/surfer-extracted \
 && apt-get purge -y unzip curl && apt-get autoremove -y && rm -rf /var/lib/apt/lists/*

EXPOSE 5173
CMD ["npm", "run", "dev"]
