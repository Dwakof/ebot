'use strict';

module.exports = {

    async up(knex) {

        await knex.schema.createTable('reply', (table) => {

            /* ID */

            table.string('messageId').primary();
            table.string('guildId').notNullable();
            table.string('userId').notNullable();

            /* PROPERTIES */

            table.text('content');

            /* META */

            table.dateTime('createdAt').notNullable().defaultTo(knex.fn.now());
        });
    },

    async down(knex) {

        await knex.schema.dropTableIfExists('reply');
    }
};

