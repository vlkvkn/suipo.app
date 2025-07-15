# --- Stage 1: Build client ---
FROM node:20-alpine AS client-build
WORKDIR /app
COPY client_web/package*.json ./
RUN npm install
COPY client_web/ .
RUN npm run build
    
# --- Stage 2: Build server ---
FROM node:20-alpine AS server-build
WORKDIR /app
COPY server/package*.json ./
RUN npm ci --omit=dev
COPY server/ .
ENV NODE_ENV=production
ENV PORT=8000
    
# --- Stage 3: Production image ---
FROM node:20-alpine AS production

# Install nginx
RUN apk add --no-cache nginx

# Remove default nginx config and copy custom one
RUN rm -f /etc/nginx/http.d/default.conf
COPY deploy/nginx.conf /etc/nginx/http.d/default.conf
    
# Copy built client and server from previous stages
COPY --from=client-build /app/dist /usr/share/nginx/html
COPY --from=server-build /app /server

# Create nginx logs directory
RUN mkdir -p /var/log/nginx

# Expose ports
EXPOSE 80 8000
    
# Start server and nginx
CMD ["sh", "-c", "cd /server && PORT=8000 npm run start & nginx -g 'daemon off;'"]