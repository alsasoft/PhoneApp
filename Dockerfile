FROM node:8.12.0

LABEL maintainer=manuelhoyoestevez@gmail.com

# Prepare app directory
RUN mkdir -p /usr/src/app
ADD . /usr/src/app
WORKDIR /usr/src/app

# Install dependencies
RUN npm config set registry http://registry.npmjs.org/

# Install mocha (for tests)
RUN npm install mocha -g

# Build the app
RUN npm install

# Run the app
CMD ["npm", "start"]
