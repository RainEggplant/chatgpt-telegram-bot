# Builder stage
FROM node:lts-alpine AS builder

RUN npm install -g pnpm

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --ignore-scripts 

COPY . .
RUN pnpm build


# Runner stage
FROM node:lts-alpine

RUN npm install -g pnpm

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --ignore-scripts --prod --no-optional

# Install prebuilt lmdb binary
RUN arch_out=$(uname -m) \
 && if [ "${arch_out}" = "x86_64" ]; then \
        ARCH=x64; \
    elif [ "${arch_out}" = "aarch64" ]; then \
        ARCH=arm64; \
    elif echo "${arch_out}" | grep -q "armv"; then \
        ARCH=arm; \
    else \
        ARCH=${arch_out}; \
    fi \
 && LMDB_VER=$(pnpm list lmdb | grep lmdb | awk '{print $2}') \
 && pnpm add @lmdb/lmdb-linux-$ARCH@$LMDB_VER --ignore-scripts --prod --no-optional
# We can also build it ourselves:
# RUN apk add --no-cache python3 build-base
# RUN npm explore lmdb -- npm run install

COPY --from=builder /app/dist ./dist

CMD pnpm start
