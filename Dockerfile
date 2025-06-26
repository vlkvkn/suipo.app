# Fly multi-stage build for suipo.app server and client

# ---- Build client_web ----
FROM node:20 AS client-builder
WORKDIR /app/client_web
COPY client_web/package.json client_web/package-lock.json ./
RUN npm ci
COPY client_web/ .
RUN npm run build

# ---- Build server ----
FROM node:20 AS server-builder
WORKDIR /app/server
COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev
COPY server/ .

# ---- Runtime image ----
FROM node:20-slim
WORKDIR /app
COPY --from=server-builder /app/server ./server
COPY --from=client-builder /app/client_web/dist ./client_web/dist
ENV NODE_ENV=production
ENV PORT=8000
ENV ASSETS_PORT=8001
EXPOSE 8000
EXPOSE 8001
CMD ["node", "server/index.js"]

