FROM node:20-bullseye
WORKDIR /app/client
# Install dependencies only (source code will be mounted by docker-compose)
COPY package*.json ./
RUN npm install
EXPOSE 5173
CMD ["npm", "run", "dev"]
