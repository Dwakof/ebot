'use strict';

module.exports = {

    async up(knex) {

        await knex.schema.createTable('search', (table) => {

            /* ID */

            table.string('guildId').notNullable();
            table.string('userId').notNullable();
            table.string('search').notNullable();

            /* PROPERTIES */

            table.integer('used').default(1);

            /* META */

            table.primary(['guildId', 'userId', 'search']);
        });
    },

    async down(knex) {

        await knex.schema.dropTableIfExists('search');
    }
};

