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
RUN apk add --no-cache nginx
WORKDIR /app

# API production deps
COPY api/package*.json ./
RUN npm ci --omit=dev
COPY --from=api-build /api/dist ./dist
COPY api/migrations ./migrations

# Web static files
COPY --from=web-build /web/dist /usr/share/nginx/html

# Nginx config
COPY nginx.prod.conf /etc/nginx/http.d/default.conf

# Start script - migrate, seed, start nginx + API
RUN printf '#!/bin/sh\nset -e\nnode dist/migrate.js\nnode dist/seed.js\nnginx\nexec node dist/index.js\n' > /app/start.sh && chmod +x /app/start.sh

EXPOSE 3000
CMD ["/app/start.sh"]
