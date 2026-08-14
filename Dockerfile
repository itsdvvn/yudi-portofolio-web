FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=4321

COPY package*.json ./
RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/@keystatic ./node_modules/@keystatic
COPY --from=builder /app/src/content ./src/content
COPY --from=builder /app/keystatic.config.ts ./keystatic.config.ts

EXPOSE 4321

CMD ["node", "./dist/server/entry.mjs"]
