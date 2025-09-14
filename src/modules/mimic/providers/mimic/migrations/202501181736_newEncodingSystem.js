'use strict';

module.exports = {

    async up(knex) {

        await knex.schema.alterTable('model', (table) => {

            table.dropColumns('model');
        });

        await knex.schema.alterTable('model', (table) => {

            table.binary('model');
        });
    },

    async down(knex) {

        await knex.schema.alterTable('model', (table) => {

            table.dropColumns('model');
        });

        await knex.schema.alterTable('reply', (table) => {

            table.json('model');
        });
    }
};

