FROM node:22-bookworm-slim

WORKDIR /app

# Instalar dependencias del sistema requeridas por Playwright / Chromium
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copiar manifiestos de dependencias
COPY package.json package-lock.json* ./

# Instalar dependencias del proyecto
RUN npm install

# Instalar Chromium y dependencias a nivel de sistema operativo para exportación de PDF
RUN npx playwright install --with-deps chromium

# Copiar el código fuente del proyecto
COPY . .

# Variables de entorno predeterminadas
ENV NODE_ENV=development \
    HOSTNAME=0.0.0.0 \
    PORT=3000 \
    CV_HOST=0.0.0.0 \
    CV_PORT=4317 \
    CHROMIUM_FLAGS="--no-sandbox --disable-setuid-sandbox --disable-dev-shm-usage"

EXPOSE 3000 4317

# Comando por defecto
CMD ["npm", "run", "dev"]
