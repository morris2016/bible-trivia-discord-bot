# Use Node.js LTS version
FROM node:18-slim

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Make the start script executable
RUN chmod +x start-bot.sh

# Expose any ports if needed
EXPOSE 3000

# Run the bot
CMD ["./start-bot.sh"]
