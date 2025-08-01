
# Use a specific, stable version of Node.js
FROM node:20-alpine

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json first to leverage Docker cache
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of your app's source code
COPY . .

# Expose the port Vite runs on
EXPOSE 5173

# The command to run your app
CMD ["npm", "run", "dev"]
