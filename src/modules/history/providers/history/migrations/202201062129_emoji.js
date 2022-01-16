'use strict';

module.exports = {

    async up(knex) {

        await knex.schema.createTable('emoji', (table) => {

            /* ID */

            table.string('messageId');

            /* PROPERTIES */

            table.string('guildId').notNullable();
            table.string('channelId').notNullable();
            table.string('authorId').notNullable();

            table.string('type').notNullable();
            table.string('emoji').notNullable();
            table.string('name').notNullable();
            table.boolean('unicode').notNullable();
            table.integer('index').notNullable();

            /* META */

            table.dateTime('createdAt').notNullable().defaultTo(knex.fn.now());
            table.dateTime('updatedAt').notNullable().defaultTo(knex.fn.now());

            table.primary(['messageId', 'authorId', 'type', 'emoji', 'index']);

            table.index(['guildId', 'authorId', 'type', 'emoji']);
            table.index(['guildId', 'emoji', 'type', 'authorId']);
        });
    },

    async down(knex) {

        await knex.schema.dropTableIfExists('emoji');
    }
};
