FROM node:25 AS base

ENV APP_PATH=/app

RUN --mount=type=cache,target=/var/cache/apt \
    apt-get update \
    && apt-get install -y --no-install-recommends build-essential dumb-init \
    && rm -rf /var/lib/apt/lists/*

#########################################################

FROM base AS dependencies

WORKDIR $APP_PATH

COPY package*.json ./

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

RUN --mount=type=cache,target=/usr/src/app/.npm \
    npm set cache /usr/src/app/.npm \
    && npm ci --omit=dev

#########################################################

FROM base AS puppeteer

RUN --mount=type=cache,target=/var/cache/apt \
    apt-get update \
    && apt-get install -y --no-install-recommends wget gnupg \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y --no-install-recommends google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 fonts-noto-color-emoji fonts-noto \
    && rm -rf /var/lib/apt/lists/* \
    && usermod -aG audio,video node

ENV CHROMIUM_PATH="google-chrome-stable"

#########################################################

FROM puppeteer AS release

USER node

WORKDIR $APP_PATH

COPY --chown=node:node --from=dependencies $APP_PATH/package*.json ./
COPY --chown=node:node --from=dependencies $APP_PATH/node_modules  ./node_modules
COPY --chown=node:node src $APP_PATH/src

CMD [ "dumb-init", "node", "--experimental-transform-types", "src/index.js" ]
