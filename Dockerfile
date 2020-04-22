FROM node:lts-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN apk add python make gcc g++

RUN npm install
COPY . .

EXPOSE 80

CMD [ "node", "src/index.js" ]
