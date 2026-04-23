# Use the latest LTS version of Node.js with a slim image for compatibility
FROM node:22-slim

# Set the working directory inside the container
WORKDIR /app

# Copy package files first to optimize Docker's build cache
COPY package*.json ./

# Install dependencies using the lockfile
RUN npm ci

# Copy only the files needed to build the application
COPY src ./src
COPY nest-cli.json ./
COPY tsconfig*.json ./

# Build the TypeScript application
RUN npm run build

# Expose the backend port
EXPOSE 3000

# Start the application in production mode
CMD ["npm", "run", "start:prod"]
