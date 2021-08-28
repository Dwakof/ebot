'use strict';

module.exports = {

    async up(knex) {

        await knex.schema.alterTable('message', (table) => {

            table.text('content').notNullable().alter();
        });
    },

    async down(knex) {

        await knex.schema.alterTable('message', (table) => {

            table.string('content').notNullable().alter();
        });
    }
};

