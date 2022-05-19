'use strict';

module.exports = {

    async up(knex) {

        await knex.schema.alterTable('reply', (table) => {

            table.string('start').defaultTo('');
        });
    },

    async down(knex) {

        await knex.schema.alterTable('reply', (table) => {

            table.dropColumns('start');
        });
    }
};

