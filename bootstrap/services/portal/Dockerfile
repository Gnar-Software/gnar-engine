# Dockerfile for Portal Service
FROM node:20-alpine

# Set the working directory
WORKDIR /usr/gnar_engine/app

# Copy package.json and package-lock.json
COPY ./services/portal/package*.json ./

# Copy public directory
COPY ./services/portal/public ./public

# Copy local Lib packages
COPY ./Lib ./Lib

# Install app dependencies
RUN npm install

# Expose the port the service will run on
EXPOSE 3000

# Start the application
CMD ["npm", "run", "start"]
