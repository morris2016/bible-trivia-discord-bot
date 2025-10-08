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

# Install TypeScript and ts-node for handling .ts imports
RUN npm install typescript ts-node --save-dev

# Configure ts-node for ESM
RUN echo '{"compilerOptions": {"target": "ES2020", "module": "ESNext", "moduleResolution": "Node", "esModuleInterop": true, "allowSyntheticDefaultImports": true, "forceConsistentCasingInFileNames": true, "strict": false, "skipLibCheck": true}, "include": ["**/*.ts"], "exclude": ["node_modules"], "ts-node": {"esm": true}}' > tsconfig.json

# Install @types/node for Node.js types
RUN npm install @types/node --save-dev

# Make the start script executable
RUN chmod +x start-bot.sh

# Expose any ports if needed
EXPOSE 3000

# Run the bot
CMD ["./start-bot.sh"]
