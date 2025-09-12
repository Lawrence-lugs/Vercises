FROM node:20-bullseye
WORKDIR /app/client
COPY . .
RUN npm install
EXPOSE 5173
CMD ["npm", "run", "dev"]
