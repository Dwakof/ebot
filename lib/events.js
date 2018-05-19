'use strict';

module.exports.registerEvents = (client, events) => {

    events.forEach((eventDef) => {

        client.on(eventDef.event, eventDef.handler);

        client.log.debug({
            event     : 'eventBinding',
            eventName : eventDef.event
        }, `Event on '${eventDef.event}' registered`);
    });
};
