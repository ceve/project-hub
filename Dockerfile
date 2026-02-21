FROM node:20-alpine AS api-build
WORKDIR /api
COPY api/package*.json ./
RUN npm ci
COPY api/ .
RUN npx tsc

FROM node:20-alpine AS web-build
WORKDIR /web
COPY web/package*.json ./
RUN npm ci
COPY web/ .
RUN npm run build

FROM node:20-alpine
RUN apk add --no-cache curl
WORKDIR /app

# API production deps
COPY api/package*.json ./
RUN npm ci --omit=dev
COPY --from=api-build /api/dist ./dist
COPY api/migrations ./migrations

# Web static files served by Express
COPY --from=web-build /web/dist ./public

# Start script
RUN printf '#!/bin/sh\nset -e\nnode dist/migrate.js\nnode dist/seed.js\nexec node dist/index.js\n' > /app/start.sh && chmod +x /app/start.sh

EXPOSE 3000
CMD ["/app/start.sh"]
