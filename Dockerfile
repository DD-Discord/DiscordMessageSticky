FROM node:latest

# Create the directory!
RUN mkdir -p /sticky
WORKDIR /sticky

# Copy and Install our bot
COPY package.json /sticky
COPY package-lock.json /sticky
RUN npm install

# Our precious bot
COPY . /sticky

# Start me!
CMD ["node", "index.js"]
