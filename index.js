const Envy = require('envy');
const Raven = require('raven');
const Commando = require('discord.js-commando');

const settings = Envy(process.env.DOTENV_PATH || './.env');

Raven.config(settings.sentryEndpoint).install();

const client = new Commando.Client({
		owner: settings.discordOwnerId
});

client.on('error', (error) => {

		Raven.captureException(error);
		console.error(error);
});

client.on('warning', (...data) => {

		console.warn(data);
});

client.on('ready', () => {

		// NOTIFY IN #BLACKMESA
		console.log('READY');
});

client.on('disconnect', () => {

		console.warn('Disconnected!');
});

client.on('reconnecting', () => {

		console.warn('Reconnecting...');
});

client.on('commandError', (command, error) => {

		if(error instanceof Commando.FriendlyError) {
				return;
		}

		Raven.captureException(error);
		console.error(`Error in command ${command.groupID}:${command.memberName}`, error);
});
