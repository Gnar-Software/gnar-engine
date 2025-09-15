# Dockerfile for Agent Service
FROM gnarengine/service-core:1.0.0

# Set the working directory
WORKDIR /usr/gnar_engine/app

# Copy local Lib packages
# COPY ./Lib ./Lib

# Copy package.json and package-lock.json
COPY ./Services/Agent/package*.json ./

# Install nodemon
RUN npm install -g nodemon

# Install app dependencies
RUN npm install

# Expose the port the service will run on
EXPOSE 3000

# Start the application
CMD ["nodemon", "--watch", "./gnar_engine", "./gnar_engine/app.js"]
