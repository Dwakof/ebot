## [0.11.1](https://github.com/Dwakof/ebot/compare/v0.11.0...v0.11.1) (2021-09-24)


### Bug Fixes

* mimic command not working ([a554deb](https://github.com/Dwakof/ebot/commit/a554debf14421cc85200292abce77c6ff776d150))

# [0.11.0](https://github.com/Dwakof/ebot/compare/v0.10.0...v0.11.0) (2021-09-24)


### Bug Fixes

* rebuild not working ([f2070b4](https://github.com/Dwakof/ebot/commit/f2070b42846573dec645fde49a9f9b8b9673377b))


### Features

* Rework mimic ([922626f](https://github.com/Dwakof/ebot/commit/922626f426412aa2204ffc063e7df0057578e324)), closes [#189](https://github.com/Dwakof/ebot/issues/189) [#194](https://github.com/Dwakof/ebot/issues/194) [#189](https://github.com/Dwakof/ebot/issues/189) [#194](https://github.com/Dwakof/ebot/issues/194)
* update mimic command to be able to use ebot or guild version ([fc6d368](https://github.com/Dwakof/ebot/commit/fc6d368e3b9044a2bdaf3356a2fc8d5b56567bd5))

# [0.10.0](https://github.com/Dwakof/ebot/compare/v0.9.0...v0.10.0) (2021-09-21)


### Bug Fixes

* send a error message in a slash command failure to avoid slash command hanging ([73dcbc7](https://github.com/Dwakof/ebot/commit/73dcbc7d67f185b1c2d955a688671bfd49b91bb9))


### Features

* Karma command and slashCommand default to giving you your karma stats unless you specify a user ([faa9c04](https://github.com/Dwakof/ebot/commit/faa9c04adde5f515644a654dbfc6d94b1df48719)), closes [#222](https://github.com/Dwakof/ebot/issues/222)

# [0.9.0](https://github.com/Dwakof/ebot/compare/v0.8.2...v0.9.0) (2021-09-20)


### Bug Fixes

* codeBlock were not doing actual code block but quote block ([73eacab](https://github.com/Dwakof/ebot/commit/73eacabd53172aaae2a421348b5932c3c62737b8))


### Features

* slash applications permissions and global support ([83b4ebd](https://github.com/Dwakof/ebot/commit/83b4ebd4b2a2c4979658168979952ae38e041c1a))

## [0.8.2](https://github.com/Dwakof/ebot/compare/v0.8.1...v0.8.2) (2021-09-18)


### Bug Fixes

* avoid ping on mimic ([5d07d86](https://github.com/Dwakof/ebot/commit/5d07d86127b3a5a84cd04bb763be3020e0d0b595)), closes [#209](https://github.com/Dwakof/ebot/issues/209)
* Retry if mimic generation == given string or empty string ([094dc3e](https://github.com/Dwakof/ebot/commit/094dc3ec4534d954214e67abc8c3f8e036d22bce)), closes [#220](https://github.com/Dwakof/ebot/issues/220)

## [0.8.1](https://github.com/Dwakof/ebot/compare/v0.8.0...v0.8.1) (2021-09-18)


### Bug Fixes

* Bug with duplicated command because global and perGuilds command could be registered at the same time ([fc0b93e](https://github.com/Dwakof/ebot/commit/fc0b93e96c6ca54f19a0ec2c3b9a9284586df6dc))

# [0.8.0](https://github.com/Dwakof/ebot/compare/v0.7.0...v0.8.0) (2021-09-16)


### Features

* image search command ([3f0cc93](https://github.com/Dwakof/ebot/commit/3f0cc93f9320798a01fff20f80155b5188a6d782))

# [0.7.0](https://github.com/Dwakof/ebot/compare/v0.6.0...v0.7.0) (2021-09-16)


### Features

* isthereanydeal command ([cadaa8d](https://github.com/Dwakof/ebot/commit/cadaa8d42d589c5291f86534159873812abc1812))

# [0.6.0](https://github.com/Dwakof/ebot/compare/v0.5.0...v0.6.0) (2021-09-14)


### Features

* SlashCommand support ([748a1e0](https://github.com/Dwakof/ebot/commit/748a1e021bd5d8386e4580a26d6b57eab1766c14))

# [0.5.0](https://github.com/Dwakof/ebot/compare/v0.4.5...v0.5.0) (2021-09-11)


### Features

* add UrbanDictionary lookup command ([1abfd52](https://github.com/Dwakof/ebot/commit/1abfd52cc74598f7500713ca674e10d6e3de9ff7))

## [0.4.5](https://github.com/Dwakof/ebot/compare/v0.4.4...v0.4.5) (2021-09-10)


### Bug Fixes

* **cake:** stop reacting to "kek"-only messages ([189373b](https://github.com/Dwakof/ebot/commit/189373b101e8c3a2b2c3c5e80687c8bb5da49a80))

## [0.4.4](https://github.com/Dwakof/ebot/compare/v0.4.3...v0.4.4) (2021-09-08)


### Bug Fixes

* Don't try to sync NSFW channel ([2dd2b0f](https://github.com/Dwakof/ebot/commit/2dd2b0f97f88599ef4c5e7a261d53a4b25c2ce4a)), closes [#205](https://github.com/Dwakof/ebot/issues/205)

## [0.4.3](https://github.com/Dwakof/ebot/compare/v0.4.2...v0.4.3) (2021-09-07)


### Bug Fixes

* retry 5 time before abandoning to generate a mimic response ([12d32bd](https://github.com/Dwakof/ebot/commit/12d32bd1fc75de3c50916e5d19b9f8f64139f713))

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
