## [0.4.2](https://github.com/Dwakof/ebot/compare/v0.4.1...v0.4.2) (2021-09-07)


### Bug Fixes

* broken mimic because of local test ([c4557a4](https://github.com/Dwakof/ebot/commit/c4557a4dc08a4b0e54e774fa31e603aa85187408))

## [0.4.1](https://github.com/Dwakof/ebot/compare/v0.4.0...v0.4.1) (2021-09-07)


### Bug Fixes

* bump version because of broken CI ([a4659d8](https://github.com/Dwakof/ebot/commit/a4659d815da5d26bf75f0051ca16e14ad9dd0d6c))

# [0.4.0](https://github.com/Dwakof/ebot/compare/v0.3.0...v0.4.0) (2021-09-07)


### Bug Fixes

* add depends_on for postgres ([11133a9](https://github.com/Dwakof/ebot/commit/11133a928e9535849855cf5497581a18e42394ff))
* add tags on which member is mimicked for Sentry ([83a562a](https://github.com/Dwakof/ebot/commit/83a562a5a43876173816515de763c64219c20911))
* adding Karma metadata ([4684363](https://github.com/Dwakof/ebot/commit/46843636094d22bba991db61f3c630e276fa4e44)), closes [#188](https://github.com/Dwakof/ebot/issues/188) [#199](https://github.com/Dwakof/ebot/issues/199)
* avoid pinging on karma update ([31dd8ac](https://github.com/Dwakof/ebot/commit/31dd8acab0316d1822a4ba23ebbeaf73f5319163)), closes [#187](https://github.com/Dwakof/ebot/issues/187)
* better help for `clap` ([21449f9](https://github.com/Dwakof/ebot/commit/21449f9ebffede1db268d760dc792514f90f8111))
* don't wanna deal with alpine image for the time being ([c2ead0f](https://github.com/Dwakof/ebot/commit/c2ead0fdb989e3f336e0b69a87ff70ce505e7055))
* don't wanna deal with alpine image for the time being ([68b8a08](https://github.com/Dwakof/ebot/commit/68b8a088d3215abdf05ef25275b209010ee5b5cd))
* double ping on narcissist reply when adding a reaction on your own message ([a0bdc4d](https://github.com/Dwakof/ebot/commit/a0bdc4d7b8aaa72d8f473ac500ef9530b77390e4)), closes [#191](https://github.com/Dwakof/ebot/issues/191)
* dumb dumb ([db4dec3](https://github.com/Dwakof/ebot/commit/db4dec363f0cb855a18b463fed161756ef76dacb))
* issue with content field being only a string instead of a text ([71ea90b](https://github.com/Dwakof/ebot/commit/71ea90bfd7aa1a0573de47019b9b4ba6365be5b0))
* MESSAGE_UPDATE is called for embed as well ([efd6c9b](https://github.com/Dwakof/ebot/commit/efd6c9b2359f5fc19c1ba628389f9ac4d9216438))
* naming database for reaction-role ([3f2df3c](https://github.com/Dwakof/ebot/commit/3f2df3cc0feb25ea5a3ca2a3c790e74e0c924053))
* prompt question for mimic command ([ea5c993](https://github.com/Dwakof/ebot/commit/ea5c9939bcf67a724e7cc72c1ec3249e63e4f26c))
* remove console.log ([9f96531](https://github.com/Dwakof/ebot/commit/9f965313c20df9b51924c157145bc244193c04b5))
* reuse utils.requireDir where I can ([e2583ad](https://github.com/Dwakof/ebot/commit/e2583ad16e911e96ecf63074cdd4e6ee1c50836c))
* rollback version in dockerfile as node 16 is not supported by erlpack yet ([1f7d2d8](https://github.com/Dwakof/ebot/commit/1f7d2d8191f623c873ed84905a7bd6f71d0c7aa0))
* script multi DB not working ([d9c1792](https://github.com/Dwakof/ebot/commit/d9c1792975f69e2dc311ed2775515b4e1d3f3134))
* some bad binding ([352d63b](https://github.com/Dwakof/ebot/commit/352d63b3825dda66a99368fac87a153093191f67))
* use underscore instead of dash in database name ([461e80d](https://github.com/Dwakof/ebot/commit/461e80dd7e055eff9db112a7b70a8b32614bd3c5))


### Features

* 👁👄👁 ([be51562](https://github.com/Dwakof/ebot/commit/be515620d6adc238adfab4317c9041ba26b2c68f))
* 0.4.0 ([d8a5799](https://github.com/Dwakof/ebot/commit/d8a5799c51899461147b1ea17d029c0959e77ac3))
* add ASCII module ([c8ebb4c](https://github.com/Dwakof/ebot/commit/c8ebb4c0380fc16b68633771c5c736436f33f56f))
* add sentry tracing to commands ([c5353d7](https://github.com/Dwakof/ebot/commit/c5353d77cc537ece20289c8250aa64503cc80a13)), closes [#192](https://github.com/Dwakof/ebot/issues/192)
* add some log for guild ([8e5e789](https://github.com/Dwakof/ebot/commit/8e5e78906555729d1ec50d22af87a5a8553a3779))
* Better history module with ([944df8b](https://github.com/Dwakof/ebot/commit/944df8b2ca6832e75f265eaeb54cf4c687ae9c65))
* history module to sync discord message with a database ([f54c158](https://github.com/Dwakof/ebot/commit/f54c158c161b2ab9b1b2f379f4bd9b2077a20522))
* More chaotic mimic ([7251daa](https://github.com/Dwakof/ebot/commit/7251daa97b3618749833b6213338cadbac105821))
* new System of Services to store reusable function and access it everywhere ([702a515](https://github.com/Dwakof/ebot/commit/702a515e97906fb257ae7abaa14c1a1b2d12dbf2))
* rework provider system to allows multi provider per modules and to get module's providers directly ([44a9ac8](https://github.com/Dwakof/ebot/commit/44a9ac8b2a92569d62ec373c1d71b42232a79a49))
* save mimicked replies to database for later use ([9715812](https://github.com/Dwakof/ebot/commit/9715812ba8157541e876a9bb9c4b4ee051c33e72)), closes [#194](https://github.com/Dwakof/ebot/issues/194)
* update to discordJS 13 ([794b0ce](https://github.com/Dwakof/ebot/commit/794b0ceadad90b381cad3187617254bbc90982a4))
