# Use Node.js LTS version
FROM node:18-slim

# Create app directory
WORKDIR /app

# Copy discord-bot directory contents
COPY discord-bot/ ./

# Also copy src directory for bible-questions-data.ts
COPY src/ ./src/

# Install dependencies
RUN npm ci --only=production

# Make the start script executable
RUN chmod +x start-bot.sh

# Expose any ports if needed
EXPOSE 3000

# Run the bot
CMD ["./start-bot.sh"]
