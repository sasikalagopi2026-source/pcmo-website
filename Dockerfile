FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build && npm prune --omit=dev

FROM node:22-bookworm-slim AS production
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/server-dist ./server-dist
COPY --from=build /app/server/schema.sql ./server-dist/schema.sql
COPY --from=build /app/output ./output
COPY --from=build /app/public/webinars ./dist/webinars
# The dist directory already contains webinars copied from public/webinars during the Vite build.
# The explicit COPY above is a safety net for environments where the build skips static assets.
EXPOSE 3001
CMD ["npm", "start"]
