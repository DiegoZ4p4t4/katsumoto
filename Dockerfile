# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

COPY . .

RUN pnpm run build

# Production stage
FROM nginx:alpine AS runner

RUN addgroup -g 1001 app && adduser -u 1001 -G app -s /bin/sh -D appuser

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

RUN chown -R appuser:app /usr/share/nginx/html && \
    chown -R appuser:app /var/cache/nginx && \
    chown -R appuser:app /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown appuser:app /var/run/nginx.pid

USER appuser

EXPOSE 8551

CMD ["nginx", "-g", "daemon off;"]
