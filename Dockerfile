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

# Install TypeScript and ts-node, then compile to JS
RUN npm install typescript ts-node --save-dev

# Compile TypeScript files to JavaScript in src directory
RUN npx tsc src/bible-questions-data.ts --target ES2020 --module ESNext --moduleResolution Node --esModuleInterop --allowSyntheticDefaultImports --outDir src-js --skipLibCheck

# Move compiled JS to src directory
RUN mv src-js/src/bible-questions-data.js src/bible-questions-data.js 2>/dev/null || cp src-js/bible-questions-data.js src/ 2>/dev/null || true
RUN cp src/bible-questions-data.js src/bible-questions-data.ts.js 2>/dev/null || true

# Make the start script executable
RUN chmod +x start-bot.sh

# Expose any ports if needed
EXPOSE 3000

# Run the bot
CMD ["./start-bot.sh"]
