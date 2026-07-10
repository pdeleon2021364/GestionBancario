FROM node:22-alpine

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.29.2 --activate

COPY package.json ./
RUN pnpm install

COPY . .

EXPOSE 3005

CMD ["node", "index.js"]
