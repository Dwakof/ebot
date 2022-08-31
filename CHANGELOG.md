## [0.25.3](https://github.com/Dwakof/ebot/compare/v0.25.2...v0.25.3) (2022-08-31)


### Bug Fixes

* weather not responding with the dashboard reply ([ff5d6dc](https://github.com/Dwakof/ebot/commit/ff5d6dcf39b413b56e651606dcd295b53a331264))

## [0.25.2](https://github.com/Dwakof/ebot/compare/v0.25.1...v0.25.2) (2022-08-31)


### Bug Fixes

* application Guild commands not correctly patched ([3737191](https://github.com/Dwakof/ebot/commit/3737191ab6aa24a9b11d6dc4be146ca4ade13fd5))

## [0.25.1](https://github.com/Dwakof/ebot/compare/v0.25.0...v0.25.1) (2022-08-27)


### Bug Fixes

* update dependencies ([cf970cd](https://github.com/Dwakof/ebot/commit/cf970cd19b3309c55d7ad729c098377d0270d50c))

# [0.25.0](https://github.com/Dwakof/ebot/compare/v0.24.3...v0.25.0) (2022-08-27)


### Features

* **core:** Rework command registration system ([530309c](https://github.com/Dwakof/ebot/commit/530309c9fe2f7338246ab38de43385607c5aebad)), closes [#223](https://github.com/Dwakof/ebot/issues/223)

## [0.24.3](https://github.com/Dwakof/ebot/compare/v0.24.2...v0.24.3) (2022-08-19)


### Bug Fixes

* gtp-3 character edition from list broken ([a1da16d](https://github.com/Dwakof/ebot/commit/a1da16d18a1d3a29bc07003804e05452317afae2))
* typo ([db531ce](https://github.com/Dwakof/ebot/commit/db531ce6a1558135466b2de803d3f3e17bf2cadc))

## [0.24.2](https://github.com/Dwakof/ebot/compare/v0.24.1...v0.24.2) (2022-08-19)


### Bug Fixes

* export version on the client for info command ([7fe0477](https://github.com/Dwakof/ebot/commit/7fe0477e79de2723ba182e3d24232b0f5d5ac252))

## [0.24.1](https://github.com/Dwakof/ebot/compare/v0.24.0...v0.24.1) (2022-08-19)


### Bug Fixes

* I was wrong, you still need to disable chrome sandbox in Docker or grand SYS_ADMIN to the container :bruh: ([c423c4e](https://github.com/Dwakof/ebot/commit/c423c4e894f9d57aba3a5c5c30261e10b5fe3f07))

# [0.24.0](https://github.com/Dwakof/ebot/compare/v0.23.0...v0.24.0) (2022-08-19)


### Bug Fixes

* Presence was not working anymore ([33f5853](https://github.com/Dwakof/ebot/commit/33f585338ca4ca37d7d98ae1399509c4cef5d776))


### Features

* 0.24.0 ([ad4931d](https://github.com/Dwakof/ebot/commit/ad4931d1040042e5884bf07fc06e7038d868eee7))

# [0.23.0](https://github.com/Dwakof/ebot/compare/v0.22.0...v0.23.0) (2022-08-03)


### Bug Fixes

* some broken require for v14 ([0374fd1](https://github.com/Dwakof/ebot/commit/0374fd19d2d200a290b417b0ca3384772ef315ef))


### Features

* update to discord.js v14 ([6162082](https://github.com/Dwakof/ebot/commit/616208201871e69658b0918f8ef1d64ec43681cd))

# [0.22.0](https://github.com/Dwakof/ebot/compare/v0.21.0...v0.22.0) (2022-06-21)


### Bug Fixes

* add a message to some logged event ([9018c08](https://github.com/Dwakof/ebot/commit/9018c0885078186165134284316915bff797490a))


### Features

* Store previous /weather search by user to suggest them when using /weather later. ([86c847b](https://github.com/Dwakof/ebot/commit/86c847b9add2423cc73078366b570c3f17e10c9c)), closes [#441](https://github.com/Dwakof/ebot/issues/441)

# [0.21.0](https://github.com/Dwakof/ebot/compare/v0.20.1...v0.21.0) (2022-05-19)


### Bug Fixes

* Remove annoying ajv message ([3a3e75b](https://github.com/Dwakof/ebot/commit/3a3e75b041ecfb8e96e9731cd86883c797d3ce60))


### Features

* **mimic:** add a 🔁 on mimic reply to repeat the same task ([13547e4](https://github.com/Dwakof/ebot/commit/13547e4238d610d35c1deaafcf65690958999c6e)), closes [#225](https://github.com/Dwakof/ebot/issues/225)
* add basic CRON system for mimic ([691c487](https://github.com/Dwakof/ebot/commit/691c4874385834d2bccf89eb146f743ad32839d4)), closes [#195](https://github.com/Dwakof/ebot/issues/195)

## [0.20.1](https://github.com/Dwakof/ebot/compare/v0.20.0...v0.20.1) (2022-05-18)


### Bug Fixes

* memberNicknameMention removed from @discordjs/builders ([9f67674](https://github.com/Dwakof/ebot/commit/9f67674bc3056f6f265089842eb773702689e590))

# [0.20.0](https://github.com/Dwakof/ebot/compare/v0.19.3...v0.20.0) (2022-05-18)


### Bug Fixes

* missing new on DateTime from Luxon ([0b84c29](https://github.com/Dwakof/ebot/commit/0b84c29643accd1d543f8a268250671a598b05f0))
* remove classic command weather (fuck tarduck) ([24d3441](https://github.com/Dwakof/ebot/commit/24d34417fcb94cded4ec32202d57655142349f79))
* remove DayJS ([e7cead5](https://github.com/Dwakof/ebot/commit/e7cead505043d73dfbbd6a810cb9448c04298dcc))
* remove Got ([68693f4](https://github.com/Dwakof/ebot/commit/68693f4c6bec8b1739b7e3921cf71254baf9edda))
* some clean up as well removing handling application permissions and update dependencies ([9b09ca1](https://github.com/Dwakof/ebot/commit/9b09ca13b7c3c2e796dc36321bf428f1cdeca2f8))
* update dependencies ([49d8a8c](https://github.com/Dwakof/ebot/commit/49d8a8cfca0ef1b5fcccd062dc1b545eac8eabe4))
* use a class method for autocomplete on weather ([7886605](https://github.com/Dwakof/ebot/commit/7886605ae9283094a9fef573f32f2fcb1a93ddc6))


### Features

* add autocomplete feature on Weather location ([7bf237b](https://github.com/Dwakof/ebot/commit/7bf237b901fd794972898c610ac7849b293d187b))
* add caching mechanism on service method when specified ([86bbec1](https://github.com/Dwakof/ebot/commit/86bbec13462cceddc015ea84e3ce17f268f78f95))
* allow autocomplete to be a ApplicationCommand method for reuse ([bb31741](https://github.com/Dwakof/ebot/commit/bb31741ad260c08694993925f8a5cddc7d4a22a2))
* currency now use autocomplete for currencies ([46c1073](https://github.com/Dwakof/ebot/commit/46c10731401c648fa655158568a4d7da44da9ad9))

## [0.19.3](https://github.com/Dwakof/ebot/compare/v0.19.2...v0.19.3) (2022-04-24)


### Bug Fixes

* change currency API to ExchangeRate.host ([3f1c33c](https://github.com/Dwakof/ebot/commit/3f1c33c36d928b96f680b2d39972ec78487c1867))
* update dependencies + use error's cause + use native UUID from crypto ([0f251eb](https://github.com/Dwakof/ebot/commit/0f251eba303fd4da7d31f8a77f0a210ca986427b))

## [0.19.2](https://github.com/Dwakof/ebot/compare/v0.19.1...v0.19.2) (2022-03-09)


### Bug Fixes

* v3 CurrencyAPI ([5c4b993](https://github.com/Dwakof/ebot/commit/5c4b993610cc7fb1bb610e543cc35521c6741da1))

## [0.19.1](https://github.com/Dwakof/ebot/compare/v0.19.0...v0.19.1) (2022-03-05)


### Bug Fixes

* disable cyrillic rewrite ([514176a](https://github.com/Dwakof/ebot/commit/514176a627007616d80b5e96cb78ce013c73fe10))
* update puppeteer for a version without security issue ([3964e34](https://github.com/Dwakof/ebot/commit/3964e340de0fb5fa2176a50125b194737203e653))

# [0.19.0](https://github.com/Dwakof/ebot/compare/v0.18.0...v0.19.0) (2022-03-05)


### Features

* add blyatify ([6463db6](https://github.com/Dwakof/ebot/commit/6463db64c7a006aace28ed85e0a68b89acfb08a6))
* Add S3 assets uploader to an issue with the paginatedEmbeds where image could be deleted by Discord from their CDN ([af404ba](https://github.com/Dwakof/ebot/commit/af404baeed0140d74072d1f7e677613b3ab769f5))

# [0.18.0](https://github.com/Dwakof/ebot/compare/v0.17.1...v0.18.0) (2022-02-13)


### Bug Fixes

* add default value for args on applicationCommand ([8ef299c](https://github.com/Dwakof/ebot/commit/8ef299c91fba187172ede1117cb1471f8296c397))
* add possibility to pass a MessageEmbed to client.util.send() ([adc03c7](https://github.com/Dwakof/ebot/commit/adc03c78b0a50fe037f615c85c32b29732baee8a))
* send puppeteer log through the logger instead of relaying on console.log ([915942f](https://github.com/Dwakof/ebot/commit/915942ff8e2e215035302da563ddc98d119b3833))
* update dependencies ([8666d95](https://github.com/Dwakof/ebot/commit/8666d95511702e9072f475bd266fb8925f3a3e49))


### Features

* currency commands ([7ae9ac6](https://github.com/Dwakof/ebot/commit/7ae9ac6ec91e2006089a5f252698cd071638123f)), closes [#234](https://github.com/Dwakof/ebot/issues/234)

## [0.17.1](https://github.com/Dwakof/ebot/compare/v0.17.0...v0.17.1) (2022-01-24)


### Bug Fixes

* change IsThereAnyDeal naming case for config and env ([0e6ee49](https://github.com/Dwakof/ebot/commit/0e6ee49bb28e708c52231e577d15e36a8c7ac8f8))
* emoji mapping on weather ([eaa5417](https://github.com/Dwakof/ebot/commit/eaa5417540379a4bef0d909b7f86740911785a32))

# [0.17.0](https://github.com/Dwakof/ebot/compare/v0.16.1...v0.17.0) (2022-01-23)


### Features

* Weather 2.0 ([6e4fb93](https://github.com/Dwakof/ebot/commit/6e4fb93deeaee66c10fc4fce13aa59da4cac361b))

## [0.16.1](https://github.com/Dwakof/ebot/compare/v0.16.0...v0.16.1) (2022-01-17)


### Bug Fixes

* remove console.log and fix a missing limit on user ranking for stats ([d3212ed](https://github.com/Dwakof/ebot/commit/d3212ed4be93db19bfc06848f18c412f4066377b))

# [0.16.0](https://github.com/Dwakof/ebot/compare/v0.15.1...v0.16.0) (2022-01-16)


### Bug Fixes

* applicationCommand using subgroup not working as expected ([440b3c7](https://github.com/Dwakof/ebot/commit/440b3c76c46c9f67c31cea0a36aea7f3bcd84eb0))


### Features

* finished stats maybe ([7cb80a4](https://github.com/Dwakof/ebot/commit/7cb80a4daa00274029340cec8b59410eb16307e3))
* implement views manager (similar to service) ([3c977e4](https://github.com/Dwakof/ebot/commit/3c977e40bc7b1ec50a6d8ff7b4542f6c3d5fa841))
* rework the chartjs component to make a dedicated service, add some more start output, rework karma command to use chartjs service ([e5731e5](https://github.com/Dwakof/ebot/commit/e5731e56bad44e298ce2eb86d85b3778ea055f2e))
* stats command base ([9018e1d](https://github.com/Dwakof/ebot/commit/9018e1d31ef8c8e672d0f5ec38004505710f01a4))

## [0.15.1](https://github.com/Dwakof/ebot/compare/v0.15.0...v0.15.1) (2021-11-26)


### Bug Fixes

* gust wind can be NaN ([4572749](https://github.com/Dwakof/ebot/commit/45727494a24288af8b41c253d3238e8882845e3f))

# [0.15.0](https://github.com/Dwakof/ebot/compare/v0.14.0...v0.15.0) (2021-11-26)


### Features

* add wind gust to weather command ([71081d0](https://github.com/Dwakof/ebot/commit/71081d04c01115518dcb317fcfd059bfd214a6f1))

# [0.14.0](https://github.com/Dwakof/ebot/compare/v0.13.4...v0.14.0) (2021-11-14)


### Features

* add support for article embed, invites, code block, mention, url and a proper wait time before screenshoting ([4f61e02](https://github.com/Dwakof/ebot/commit/4f61e023eca6a385c06debdc2f18ac16e1f5b0e6))
* Screenshot message on right click ([c4889ad](https://github.com/Dwakof/ebot/commit/c4889ad785e2a5bc3ad1406fa96f8b9ce2494317))

## [0.13.4](https://github.com/Dwakof/ebot/compare/v0.13.3...v0.13.4) (2021-11-12)


### Bug Fixes

* remove add/remove karma notification ([a8777aa](https://github.com/Dwakof/ebot/commit/a8777aa7f96a85c3122c68c18d592bd110beee27)), closes [#231](https://github.com/Dwakof/ebot/issues/231)
* remove console.log ([e5e9486](https://github.com/Dwakof/ebot/commit/e5e94863f923bc0aab27548c76c09f7adb9f101f))

## [0.13.3](https://github.com/Dwakof/ebot/compare/v0.13.2...v0.13.3) (2021-11-12)


### Bug Fixes

* bad command ID were generated making some applicationCommand not work at all ([31604d3](https://github.com/Dwakof/ebot/commit/31604d34dec89ad9f85ec5f7f3085eff3be796e9))

## [0.13.2](https://github.com/Dwakof/ebot/compare/v0.13.1...v0.13.2) (2021-11-12)


### Bug Fixes

* some bad handling for creating discord api schema ([477e0c4](https://github.com/Dwakof/ebot/commit/477e0c4b153e5e6b385ea838b187fec946e7fe5e))

## [0.13.1](https://github.com/Dwakof/ebot/compare/v0.13.0...v0.13.1) (2021-11-12)


### Bug Fixes

* missing miwic applicationCommand ([7f44671](https://github.com/Dwakof/ebot/commit/7f446719199f290d54a6da1c3fa5b06cdbcde4f6))

# [0.13.0](https://github.com/Dwakof/ebot/compare/v0.12.0...v0.13.0) (2021-11-12)


### Features

* uwu ([059567d](https://github.com/Dwakof/ebot/commit/059567d3c9762d69f29b54518fd852e0978efc50)), closes [#253](https://github.com/Dwakof/ebot/issues/253)

# [0.12.0](https://github.com/Dwakof/ebot/compare/v0.11.2...v0.12.0) (2021-11-12)


### Features

* Rename SlashCommand into ApplicationCommand and support other types of ApplicationCommand ([ee4f74f](https://github.com/Dwakof/ebot/commit/ee4f74f2abeb43f6c00291bbf14a62bc67de5194))

## [0.11.2](https://github.com/Dwakof/ebot/compare/v0.11.1...v0.11.2) (2021-11-12)


### Bug Fixes

* add wind direction and use HTTPS for image url ([9c9a43f](https://github.com/Dwakof/ebot/commit/9c9a43f7e5ec9276178849f15bf8d9d85b41d4e2))

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
