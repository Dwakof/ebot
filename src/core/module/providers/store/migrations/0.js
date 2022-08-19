'use strict';

module.exports = {

    async up(knex) {

        await knex.schema.createTable('store', (table) => {

            /* ID */

            table.string('module').notNullable();
            table.string('namespace').notNullable();
            table.string('guildId').notNullable();
            table.string('id').notNullable();

            table.primary(['module', 'namespace', 'guildId', 'id']);

            /* PROPERTIES */

            table.json('value').nullable();

            /* META */

            table.dateTime('createdAt').notNullable().defaultTo(knex.fn.now());
            table.dateTime('updatedAt').notNullable().defaultTo(knex.fn.now());
        });
    },

    async down(knex) {

        await knex.schema.dropTableIfExists('store');
    }
};
