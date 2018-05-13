'use strict';

const Path       = require('path');
const RequireDir = require('require-dir');

exports.bind = (client, settings) => {

    Object.entries(RequireDir(Path.join(__dirname, '../events'))).forEach(([name, module]) => {

        let events;

        if (typeof module === 'function') {
            events = module(client, settings);
        }

        if (!Array.isArray(events)) {
            events = [events];
        }

        events.forEach((eventDef) => {

            client.on(eventDef.event, eventDef.handler);
        });
    });
};
