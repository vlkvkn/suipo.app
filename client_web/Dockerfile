FROM node:20-alpine

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Install serve for production
RUN npm install -g serve

EXPOSE 5173

# Start the application with proper host binding for fly.io
CMD ["serve", "-s", "dist", "-l", "5173"]