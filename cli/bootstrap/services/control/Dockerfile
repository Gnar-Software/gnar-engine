# Dockerfile for Control Service
FROM gnarengine/gnarengine-service-core:1.0

# Set the working directory
WORKDIR /usr/gnar_engine/app

# Define a global env var
ENV GLOBAL_SERVICE_BASE_DIR=/usr/gnar_engine/app/src/

# Copy package.json and package-lock.json
COPY ./services/control/package*.json ./

# Install nodemon
RUN npm install -g nodemon

# Install app dependencies
RUN npm install

# Expose the port the service will run on
EXPOSE 3000

# Start the application
CMD ["nodemon", "--watch", "./gnar_engine", "./gnar_engine/app.js"]
