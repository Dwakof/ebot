'use strict';

const Path       = require('path');
const RequireDir = require('require-dir');

exports.register = (client, settings) => {

    const modules = Object.entries(RequireDir(Path.join(__dirname, '../plugins')));

    return Promise.all(modules.map(([fileName, module]) => {

        return new Promise(async (fulfil, reject) => {

            try {
                await module.register(client, settings);

                client.log.debug({
                    event  : 'pluginRegister',
                    file   : fileName,
                    plugin : module.name || fileName
                }, `Plugin '${module.name || fileName}' registered`);

                fulfil();
            }
            catch (error) {

                client.log.error({
                    event  : 'error', file : fileName,
                    plugin : module.name || fileName
                }, error);

                client.raven.captureException(error);

                reject(error);
            }
        });
    }));
};
