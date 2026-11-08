FROM node:22-slim

WORKDIR /app

# Install only production dependencies first (better layer caching)
COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

EXPOSE 5000

# Create/update the tables, then start the API
CMD ["sh", "-c", "node scripts/migrate.js && node src/index.js"]
