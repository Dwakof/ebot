'use strict';

module.exports = {

    async up(knex) {

        await knex.delete().from('karma');

        await knex.schema.alterTable('karma', (table) => {

            table.string('messageId').notNullable();
            table.string('giverId').notNullable();
            table.string('type').notNullable();

            table.dropPrimary();

            table.primary(['guildId', 'userId', 'messageId', 'giverId', 'type', 'value']);

            table.dropColumn('id');
        });
    },

    async down(knex) {

        await knex.schema.alterTable('karma', (table) => {

            table.dropPrimary();

            table.string('id').primary();

            table.dropColumn('messageId');
            table.dropColumn('type');
            table.dropColumn('giver');
        });
    }
};
