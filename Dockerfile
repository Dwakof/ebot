FROM node:16-alpine

MAINTAINER Yoann MALLEMANCHE <yoann.mallemanche@gmail.com>

RUN apk add --no-cache --virtual native-deps \
    git autoconf libtool make automake gcc g++ python

ENV APP_PATH=/app \
    NODE_ENV=production \
    LOG_LEVEL=warning \
    SQLITE_PATH=./database.sqlite3

WORKDIR $APP_PATH

COPY package*.json .

RUN npm i --production

RUN apk del native-deps

ADD . $APP_PATH

CMD [ "npm", "start" ]
