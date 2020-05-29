'use strict';

module.exports = {

    async up(knex) {

        await knex.schema.createTable('karma', (table) => {

            /* ID */

            table.increments('id');

            table.string('guildId').notNullable();
            table.string('userId').notNullable();

            /* PROPERTIES */

            table.integer('value');

            /* META */

            table.dateTime('createdAt').notNullable().defaultTo(knex.fn.now());

            table.index(['guildId', 'userId']);
            table.index('createdAt');
        });
    },

    async down(knex) {

        await knex.schema.dropTableIfExists('karma');
    }
};

