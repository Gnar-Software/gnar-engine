# Dockerfile for Portal Service
FROM node:20-alpine

# Set the working directory
WORKDIR /usr/gnar_engine/app

# Define a global env var
ENV GLOBAL_SERVICE_BASE_DIR=/usr/gnar_engine/app/src/

# Copy package.json and package-lock.json
COPY ./package*.json ./

# Install app dependencies
RUN npm install

# Copy the rest of the application code
COPY ./index.html ./
COPY ./vite.config.js ./
COPY ./react-router.config.js ./
COPY ./public ./public
COPY ./src ./src

# Expose the port the service will run on
EXPOSE 5173
