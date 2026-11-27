FROM node:22-bookworm AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY . .
RUN if [ -f web/package.json ]; then \
      npm --prefix web ci && npm --prefix web run build; \
    else \
      mkdir -p web/dist && printf '%s\n' '<!doctype html><html lang="es"><meta charset="utf-8"><title>Ruta de la Memoria</title><body>API lista. El frontend se integra en la rama final.</body></html>' > web/dist/index.html; \
    fi

FROM node:22-bookworm-slim
ENV NODE_ENV=production \
    PORT=3000 \
    DB_PATH=/data/app.sqlite
WORKDIR /app

RUN mkdir -p /data /app/data && chown -R node:node /data /app/data
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/server ./server
COPY --from=build --chown=node:node /app/content ./content
COPY --from=build --chown=node:node /app/scripts ./scripts
COPY --from=build --chown=node:node /app/package.json ./package.json
COPY --from=build --chown=node:node /app/web/dist ./web/dist

USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:'+(process.env.PORT||3000)+'/api/config').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server/index.js"]
