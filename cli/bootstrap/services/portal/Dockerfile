# Dockerfile for Control Service
FROM node:20-alpine

# Set the working directory
WORKDIR /usr/gnar_engine/app

# Define a global env var
ENV GLOBAL_SERVICE_BASE_DIR=/usr/gnar_engine/app/src/

# Copy package.json and package-lock.json
COPY ./ ./

# Install app dependencies
RUN npm install

# Expose the port the service will run on
EXPOSE 5173
