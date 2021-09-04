'use strict';

module.exports = {

    async up(knex) {

        await knex.schema.createTable('roles', (table) => {

            /* ID */

            table.string('guildId').notNullable();
            table.string('roleId').notNullable();
            table.string('channelId').notNullable();
            table.jsonb('channelListenIds').nullable();

            table.primary(['guildId', 'roleId', 'channelId']);
        });
    },

    async down(knex) {

        await knex.schema.dropTableIfExists('roles');
    }
};
