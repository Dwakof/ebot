FROM node:16.6

MAINTAINER Yoann MALLEMANCHE <yoann.mallemanche@gmail.com>

RUN apt-get update \
    && apt-get install -qq build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev wget gnupg \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y  \
          fonts-liberation \
          gconf-service \
          libappindicator1 \
          libasound2 \
          libatk1.0-0 \
          libcairo2 \
          libcups2 \
          libfontconfig1 \
          libgbm-dev \
          libgdk-pixbuf2.0-0 \
          libgtk-3-0 \
          libicu-dev \
          libjpeg-dev \
          libnspr4 \
          libnss3 \
          libpango-1.0-0 \
          libpangocairo-1.0-0 \
          libpng-dev \
          libx11-6 \
          libx11-xcb1 \
          libxcb1 \
          libxcomposite1 \
          libxcursor1 \
          libxdamage1 \
          libxext6 \
          libxfixes3 \
          libxi6 \
          libxrandr2 \
          libxrender1 \
          libxss1 \
          libxtst6 \
          xdg-utils \
    && rm -rf /var/lib/apt/lists/*

ENV APP_PATH=/app

WORKDIR $APP_PATH

COPY package*.json ./

#ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

RUN npm ci --production

#ENV CHROMIUM_PATH="google-chrome-stable"

ADD . $APP_PATH

CMD [ "node", "src/index.js" ]
