# Node.js server image
FROM node:20 AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

COPY . .
ENV NODE_ENV=production

ENV PORT=8000
ENV ASSETS_PORT=8001
EXPOSE 8000
EXPOSE 8001

CMD ["npm", "run", "start"]