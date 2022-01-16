'use strict';

const Fs   = require('fs');
const FsP  = require('fs/promises');
const Path = require('path');

module.exports = {

    async requireDir(rootPath, info = false) {

        const requires = [];

        for (const file of await FsP.readdir(rootPath)) {

            const path = Path.join(rootPath, file);

            if (info) {

                requires.push({ file : require(path), name : file, path });
            }
            else {

                requires.push(require(path));
            }
        }

        return requires;
    },

    requireDirSync(rootPath, info = false) {

        const requires = [];

        for (const file of Fs.readdirSync(rootPath)) {

            const path = Path.join(rootPath, file);

            if (info) {

                requires.push({ file : require(path), name : file, path });
            }
            else {

                requires.push(require(path));
            }
        }

        return requires;
    }
};
