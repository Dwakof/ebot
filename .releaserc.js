'use strict';

module.exports = {
    plugins : [
        [
            '@semantic-release/commit-analyzer',
            {
                preset     : 'angular',
                parserOpts : {
                    noteKeywords : ['BREAKING CHANGE', 'BREAKING CHANGES', 'BREAKING']
                }
            }
        ],
        [
            '@semantic-release/release-notes-generator',
            {
                preset     : 'angular',
                parserOpts : {
                    noteKeywords : ['BREAKING CHANGE', 'BREAKING CHANGES', 'BREAKING']
                },
                writerOpts : {
                    commitsSort : ['subject', 'scope']
                }
            }
        ],
        '@semantic-release/changelog',
        [
            '@semantic-release/git',
            {
                assets  : ['package.json', 'package-lock.json', 'CHANGELOG.md'],
                message : 'release(version): Release ${nextRelease.version} \n\n${nextRelease.notes}'
            }
        ],
        '@semantic-release/github'
    ]
};
