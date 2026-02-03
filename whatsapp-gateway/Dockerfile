# KadaiGPT WhatsApp AI Agent
# Dockerfile for Railway Deployment

FROM node:20-alpine

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy app source
COPY . .

# Create auth directory
RUN mkdir -p auth_info

# Set environment variables
ENV NODE_ENV=production
ENV BACKEND_URL=https://kadaigpt.up.railway.app

# Start the bot
CMD ["node", "bot.js"]
