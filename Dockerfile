FROM node:lts-alpine

WORKDIR /usr/src/app

RUN apk add python make gcc g++

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 80

CMD [ "node", "src/index.js" ]
