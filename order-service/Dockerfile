# Etapa de build
FROM node:18-bullseye AS builder

WORKDIR /app

# Copiar package.json/package-lock.json (o pnpm/yarn si usas)
COPY package*.json ./

# Instalar dependencias para build
RUN npm install

# Copiar el resto de archivos
COPY tsconfig.json ./
COPY prisma ./prisma
COPY src ./src

# Generar Prisma Client y compilar TypeScript
RUN npx prisma generate
RUN npm run build

# Etapa de runtime
FROM node:18-bullseye

WORKDIR /app
ENV NODE_ENV=production

# Asegurar OpenSSL presente (libssl)
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install --omit=dev

COPY prisma ./prisma
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 4000

# Si tu servidor arranca en dist/server.js, deja así:
CMD ["node", "dist/server.js"]
# Si tu entrypoint es otro (dist/index.js), cámbialo aquí.
