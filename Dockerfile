FROM node:14

MAINTAINER Yoann MALLEMANCHE <yoann.mallemanche@gmail.com>

RUN apt-get update \
    && apt-get install -qq build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev

ENV APP_PATH=/app

WORKDIR $APP_PATH

COPY package*.json .

RUN npm i --production

ADD . $APP_PATH

CMD [ "npm", "start" ]
