# Node.js server image
FROM node:20 AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

COPY . .
ENV NODE_ENV=production

ENV PORT=8000
EXPOSE 8000

CMD ["npm", "run", "start"]