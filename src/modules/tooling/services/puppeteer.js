'use strict';

const Hoek = require('@hapi/hoek');

const { Service } = require('../../../core');
const Puppeteer   = require('puppeteer');

module.exports = class BrowserService extends Service {

    #browser;

    async init() {

        this.#browser = await Puppeteer.launch({
            args           : ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
            executablePath : process.env.CHROMIUM_PATH || undefined,
            headless       : true
        });
    }

    async newPage() {

        const page = await this.#browser.newPage();

        page.on('console', (...args) => console.log(...args));
        page.on('error', (...args) => console.error(...args));
        page.on('pageerror', (...args) => console.error(...args));

        return page;
    }

    /**
     * Smart load algorithm, checking the size of the html content to wait for JS Frontend to finish rendering and waiting for image to load
     *
     * @param {Page}   page
     * @param {Number} count
     * @param {Number} timeout
     *
     * @return {Promise<void>}
     */
    async smartWait(page, count = 3, timeout = 5000) {

        let check         = 0;
        let done          = false;
        let contentLength = (await page.content()).length;

        setTimeout(() => (done = true), timeout);

        do {

            await Hoek.wait(250);

            const newContentLength = (await page.content()).length;

            if (newContentLength === contentLength) {

                check++;
            }
            else {

                check         = 0;
                contentLength = newContentLength;
            }

        } while (check < count && !done);
    }
};
