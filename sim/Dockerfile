FROM debian:bookworm-slim

# Install EDA tools only — no Node.js, no application code
RUN apt-get update && \
    apt-get install -y --no-install-recommends iverilog yosys && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Copy synthesis helper script
COPY server/yosys-then-ivlog /usr/local/bin/yosys-then-ivlog
RUN chmod +x /usr/local/bin/yosys-then-ivlog

# Non-root user for all simulation runs
RUN useradd -m -u 1000 sim

USER sim
WORKDIR /workspace

# Exit immediately when started by docker compose up; this service exists only to produce the image.
CMD ["true"]
