'use strict';

module.exports = {

    async up(knex) {

        await knex.schema.dropTableIfExists('message');
    },

    async down(knex) {

        await knex.schema.createTable('message', (table) => {

            /* ID */

            table.string('id').primary();

            /* PROPERTIES */

            table.string('guildId').notNullable();
            table.string('authorId').notNullable();

            table.text('content').notNullable();

            /* META */

            table.dateTime('createdAt').notNullable().defaultTo(knex.fn.now());
            table.dateTime('updatedAt').notNullable().defaultTo(knex.fn.now());
        });
    }
};

