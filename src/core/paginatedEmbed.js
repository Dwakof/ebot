const { MessageActionRow } = require('discord.js');

/**
 * Makes it easy to build paginated embeds.
 * 
 * Forked from https://www.npmjs.com/package/discordjs-button-pagination and
 * modified to support custom footers and non-reply messages.
 */
const paginatedEmbed = async (
    message,
    pages,
    buttons, {
    timeout = 120000,
    useDefaultFooter = true,
    useReplies = false,
} = {}) => {
    if (!message && !message.channel) throw new Error('Channel is inaccessible.');
    if (!pages) throw new Error('Pages are not given.');
    if (!buttons) throw new Error('Buttons are not given.');
    if (buttons.length !== 2) throw new Error('Need two buttons.');
    if (buttons[0].style === 'LINK' || buttons[1].style === 'LINK') {
        throw new Error('Link buttons are not supported.');
    }

    let index = 0;

    const buttonsRow = new MessageActionRow().addComponents(buttons);
    const currentPage = await send({
        message: message, 
        useReplies: useReplies,
        payload: {
            embeds: [applyFooter(pages, index, useDefaultFooter)],
            components: [buttonsRow],
            fetchReply: true,
        },
    });

    const filter = (i) =>
        i.customId === buttons[0].customId ||
        i.customId === buttons[1].customId;

    const collector = await currentPage.createMessageComponentCollector({
        filter,
        time: timeout,
    });

    collector.on('collect', async (i) => {
        switch (i.customId) {
            case buttons[0].customId:
                index = index > 0 ? --index : pages.length - 1;
                break;
            case buttons[1].customId:
                index = index + 1 < pages.length ? ++index : 0;
                break;
            default:
                break;
        }
        await i.deferUpdate();
        await i.editReply({
            embeds: [applyFooter(pages, index, useDefaultFooter)],
            components: [buttonsRow],
        });
        collector.resetTimer();
    });

    collector.on('end', () => {
        if (!currentPage.deleted) {
            const disabledRow = new MessageActionRow().addComponents(
                buttons[0].setDisabled(true),
                buttons[1].setDisabled(true)
            );
            currentPage.edit({
                embeds: [applyFooter(pages, index, useDefaultFooter)],
                components: [disabledRow],
            });
        }
    });

    return currentPage;
};

const applyFooter = (pages, index, useDefaultFooter) => {
    if (useDefaultFooter) {
        return pages[index].setFooter(`Page ${index + 1} / ${pages.length}`);
    } else {
        return pages[index];
    }
};

const send = async ({ message, payload, useReplies } = {}) => {
    if (useReplies) {
        return message.reply(payload);
    } else {
        return message.channel.send(payload);
    }
};

module.exports = paginatedEmbed;
