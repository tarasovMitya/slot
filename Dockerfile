FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
# Railway injects RAILWAY_GIT_COMMIT_SHA — busts cache on every deploy
ARG RAILWAY_GIT_COMMIT_SHA=unknown
RUN echo "Building commit: $RAILWAY_GIT_COMMIT_SHA"
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY server.js ./server.js
EXPOSE 8080
CMD ["node", "server.js"]
