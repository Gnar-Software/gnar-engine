# Dockerfile for the ephemeral provisioning service
#
# This service is responsible for asserting the databases 
# & database users, or other single runtime provisioning tasks.

FROM node:20-alpine

# Set the working directory
WORKDIR /usr/gnar_engine/app

# Define a global env var
ENV GLOBAL_SERVICE_BASE_DIR=/usr/gnar_engine/app/src/

# Copy package.json and package-lock.json
COPY ./package*.json ./

# Copy source
COPY ./src ./src

# Install app dependencies
RUN npm install

# Start the application
CMD ["node", "./src/app.js"]
