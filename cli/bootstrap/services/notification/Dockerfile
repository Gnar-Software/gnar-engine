# Dockerfile for Notification Service
FROM node:20-alpine

# Set the working directory
WORKDIR /usr/gnar_engine/app

# Define a global env var
ENV GLOBAL_SERVICE_BASE_DIR=/usr/gnar_engine/app/src/

# Copy package.json and package-lock.json
COPY ./services/notification/package*.json ./

# Install nodemon
RUN npm install -g nodemon

# Install app dependencies
RUN npm install

# Expose the port the service will run on
EXPOSE 4000

# Start the application
CMD ["nodemon", "--watch", "./gnar_engine", "./gnar_engine/app.js"]
