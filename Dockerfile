FROM node:24-bookworm-slim AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

FROM dependencies AS builder
COPY . .
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_MEILI_URL
ARG NEXT_PUBLIC_MEILI_SEARCH_KEY
ARG NEXT_PUBLIC_WHATSAPP
ARG NEXT_PUBLIC_PHONE
ARG IMAGE_HOSTS
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL NEXT_PUBLIC_MEILI_URL=$NEXT_PUBLIC_MEILI_URL NEXT_PUBLIC_MEILI_SEARCH_KEY=$NEXT_PUBLIC_MEILI_SEARCH_KEY NEXT_PUBLIC_WHATSAPP=$NEXT_PUBLIC_WHATSAPP NEXT_PUBLIC_PHONE=$NEXT_PUBLIC_PHONE IMAGE_HOSTS=$IMAGE_HOSTS
RUN npm run build

FROM node:24-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 HOSTNAME=0.0.0.0 PORT=3000
RUN groupadd --system --gid 1001 nextjs && useradd --system --uid 1001 --gid nextjs nextjs
COPY --from=builder --chown=nextjs:nextjs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nextjs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nextjs /app/public ./public
COPY --chown=nextjs:nextjs scripts/sync-search.mjs ./scripts/sync-search.mjs
RUN mkdir -p /app/.next/cache /app/.sync-state && chown -R nextjs:nextjs /app/.next /app/.sync-state
USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node","server.js"]
