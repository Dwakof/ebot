'use strict';

module.exports = {

    async up(knex) {

        await knex.delete().from('message');

        await knex.schema.alterTable('message', (table) => {

            table.string('channelId').notNullable();

            table.index(['guildId', 'channelId' ,'createdAt']);
            table.index(['guildId', 'authorId', 'channelId', 'createdAt']);
        });
    },

    async down(knex) {

        await knex.schema.alterTable('message', (table) => {

            table.dropIndex(['guildId', 'channelId' ,'createdAt']);
            table.dropIndex(['guildId', 'authorId', 'channelId', 'createdAt']);

            table.dropColumn('channelId');
        });
    }
};
