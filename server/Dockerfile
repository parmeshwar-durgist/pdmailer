FROM node:20-bookworm-slim

# Install Chromium and required fonts
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    fonts-freefont-ttf \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Point Puppeteer to the installed Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    NODE_ENV=production \
    PORT=5000

WORKDIR /app

# Copy dependency files and patch script
COPY package*.json patch-wwebjs.js ./
RUN npm ci --omit=dev

# Copy source code
COPY . .

# Run the WhatsApp Web patch
RUN node patch-wwebjs.js

EXPOSE 5000

CMD ["node", "src/server.js"]

