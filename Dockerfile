# syntax=docker/dockerfile:1.7
# Academitna website: Next.js 15, standalone server.
# NEXT_PUBLIC_* values and the security headers are fixed at build time, so pass them as build args:
#   docker build --build-arg NEXT_PUBLIC_API_BASE_URL=https://academitna.online/api -t academitna-web .

FROM node:26-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --no-audit --no-fund

FROM node:26-alpine AS build
WORKDIR /app
ARG NEXT_PUBLIC_API_BASE_URL=https://academitna.online/api
ARG NEXT_PUBLIC_APP_URL=https://academitna.online
ARG NEXT_PUBLIC_CDN_BASE_URL=https://academitna.b-cdn.net
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL \
    NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL \
    NEXT_PUBLIC_CDN_BASE_URL=$NEXT_PUBLIC_CDN_BASE_URL \
    NEXT_PUBLIC_CDN_IMAGES_URL=$NEXT_PUBLIC_CDN_BASE_URL \
    NEXT_PUBLIC_CDN_VIDEOS_URL=$NEXT_PUBLIC_CDN_BASE_URL \
    NEXT_TELEMETRY_DISABLED=1 \
    NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:26-alpine
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    TZ=Africa/Cairo
RUN apk add --no-cache tzdata
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
USER node
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=5 \
  CMD wget -qO /dev/null http://127.0.0.1:3000/logo.png || exit 1
CMD ["node", "server.js"]
