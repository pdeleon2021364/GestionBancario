FROM node:22-alpine

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.29.2 --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

EXPOSE 3001

CMD ["node", "index.js"]
