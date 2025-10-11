# Dockerfile for service core
FROM node:20-alpine

# Set the working directory
WORKDIR /usr/gnar_engine/app

# # Bundle
# RUN esbuild src/app.js --bundle --minify --outfile=build/gnarengine-service-core/app.js

# Copy the bundle
COPY ./dist/gnarengine-service-core ./gnarengine-service-core

# Expose the port the service will run on
EXPOSE 3000

# Start the application
CMD ["nodemon", "--watch", "./gnar_engine", "./gnar_engine/app.js"]
