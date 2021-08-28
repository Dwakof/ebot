'use strict';

module.exports = {

    async up(knex) {

        await knex.schema.createTable('model', (table) => {

            /* ID */

            table.string('guildId').notNullable();
            table.string('userId').notNullable();

            /* PROPERTIES */

            table.json('model');

            /* META */

            table.dateTime('createdAt').notNullable().defaultTo(knex.fn.now());
            table.dateTime('updatedAt').notNullable().defaultTo(knex.fn.now());

            table.primary(['guildId', 'userId']);
        });

        await knex.schema.createTable('message', (table) => {

            /* ID */

            table.string('id').primary();

            /* PROPERTIES */

            table.string('guildId').notNullable();
            table.string('authorId').notNullable();

            table.string('content').notNullable();
            table.boolean('imported').defaultTo(false);

            /* META */

            table.dateTime('createdAt').notNullable().defaultTo(knex.fn.now());
            table.dateTime('updatedAt').notNullable().defaultTo(knex.fn.now());
        });
    },

    async down(knex) {

        await knex.schema.dropTableIfExists('model');
        await knex.schema.dropTableIfExists('message');
    }
};

