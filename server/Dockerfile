FROM node:20-bullseye
# EDA tools are intentionally absent — simulations run in ephemeral vercises-sim containers.
# The server only needs Node.js and the Docker socket to orchestrate them.

COPY . /app/server
WORKDIR /app/server
COPY package*.json ./
RUN npm install
EXPOSE 3000
CMD ["npx", "nodemon", "index.js"]