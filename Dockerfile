FROM node:18.10.0

MAINTAINER Yoann MALLEMANCHE <yoann.mallemanche@gmail.com>

RUN apt-get update \
    && apt-get install -y wget gnupg build-essential \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

ENV APP_PATH=/app

RUN usermod -aG audio,video node

USER node

WORKDIR $APP_PATH

COPY package*.json ./

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

RUN npm ci --omit=dev

ENV CHROMIUM_PATH="google-chrome-stable"

ADD . $APP_PATH

CMD [ "node", "src/index.js" ]
