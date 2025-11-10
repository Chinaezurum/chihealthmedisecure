# Backend Dockerfile for ChiHealth MediSecure
# This Dockerfile builds and runs the Node.js/Express backend server
# Note: Build context should be set to project root (..) to access types.ts

# Use Node.js LTS as base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files from backend directory
COPY backend/package.json backend/package-lock.json* ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy TypeScript configuration
COPY backend/tsconfig.json ./

# Copy source files
COPY backend/src/ ./src/
COPY backend/prisma/ ./prisma/
# Copy types.ts - needed by src files that import from ../../types.ts
# The compiled code will look for ../../types.js from lib/, so we need it at /app/types.ts
COPY types.ts ./types.ts

# Install TypeScript and build dependencies for building
RUN npm install typescript && \
    npm run build && \
    # TypeScript compiles imports to preserve paths, so lib/db.js will import '../../types.js'
    # Since types.ts is not compiled (not in tsconfig include), we copy it as types.js
    # to match the ES module import path
    cp types.ts types.js && \
    npm uninstall typescript && \
    npm prune --production

# Expose the port the app runs on
EXPOSE 8080

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/api/users/me', (r) => {process.exit(r.statusCode === 401 ? 0 : 1)})"

# Run the compiled server
CMD ["node", "lib/server.js"]

