FROM mhart/alpine-node:9

MAINTAINER Yoann MALLEMANCHE <yoann.mallemanche@gmail.com>

RUN apk add --no-cache --virtual native-deps \
    git autoconf libtool make automake gcc g++ python

ENV APP_PATH=/app \
    NODE_ENV=production \
    LOG_LEVEL=warning \
    SQLITE_PATH=./database.sqlite3

WORKDIR $APP_PATH

ADD . $APP_PATH

RUN npm i --production

RUN apk del native-deps

CMD [ "npm", "start" ]
