# Build and run the API (Swagger UI at /api/v1/docs when the app is up).
FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Stale incremental info (often copied from host) can make tsc emit no .js files.
RUN rm -f tsconfig.build.tsbuildinfo tsconfig.tsbuildinfo
RUN npm run build && test -f dist/main.js || (echo "Expected dist/main.js after build; got:" && ls -laR dist && exit 1)

FROM node:22-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=builder /app/dist ./dist
EXPOSE 3000
ENV PORT=3000
CMD ["node", "dist/main.js"]
