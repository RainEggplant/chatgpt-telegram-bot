# Builder stage
FROM node:lts-alpine AS builder

RUN npm install -g pnpm

WORKDIR /app

COPY config /app/config
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --ignore-scripts

COPY . .
RUN pnpm build


# Runner stage
FROM node:lts-alpine

RUN npm install -g pnpm

WORKDIR /app

COPY config /app/config
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --ignore-scripts --prod --no-optional

COPY --from=builder /app/dist ./dist

CMD pnpm start
