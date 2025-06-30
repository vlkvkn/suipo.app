# --- Stage 1: Build the application ---
    FROM node:20-alpine AS builder

    WORKDIR /app
    
    # Copy package files first for better caching
    COPY package*.json ./
    
    # Install dependencies
    RUN npm install
    
    # Copy application source code
    COPY . .
    
    # Build the application
    RUN npm run build
    
    
    # --- Stage 2: Serve static files using Nginx ---
    FROM nginx:stable-alpine AS production
    
    # Remove default Nginx configuration
    RUN rm /etc/nginx/conf.d/default.conf
    
    # Copy custom Nginx configuration
    COPY nginx.conf /etc/nginx/conf.d
    
    # Copy built application from the builder stage
    COPY --from=builder /app/dist /usr/share/nginx/html
    
    # Expose HTTP port
    EXPOSE 80
    
    # Start Nginx in the foreground
    CMD ["nginx", "-g", "daemon off;"]
    