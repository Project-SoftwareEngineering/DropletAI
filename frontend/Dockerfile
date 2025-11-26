FROM node:20-bullseye-slim AS builder

WORKDIR /app

# Install build deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ ca-certificates curl git && rm -rf /var/lib/apt/lists/*

# Copy package files and install
COPY package*.json ./
RUN if [ -f package-lock.json ] || [ -f npm-shrinkwrap.json ]; then \
    npm ci --legacy-peer-deps; \
    else \
    npm install --legacy-peer-deps; \
    fi

# Copy source and build
COPY . .
RUN npm run build

FROM node:20-bullseye-slim
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./

ENV NODE_ENV=production
RUN if [ -f package-lock.json ] || [ -f npm-shrinkwrap.json ]; then \
    npm ci --omit=dev --legacy-peer-deps; \
    else \
    npm install --omit=dev --legacy-peer-deps; \
    fi

EXPOSE 3000
CMD ["npm", "start"]
