#!/usr/bin/env node
const utils = require('./utils/env');
utils.assert('TELEGRAM_BOT_TOKEN');

const Bot = require('./bot');
const { telegram } = require('./lib/telegram/telegram');

const args = process.argv.slice(2);

const [command] = args;

const Commands = {
	webhook: (args) => {
		const [url] = args;
		console.log(`Registering webhok ${url}`);
		telegram.set_webhook(url).then((result) => {
			console.log('OK!', result);
		}).catch(e => {
			console.error(e);
		});
	},

	'get-webhook': () => {
		console.log(`Getting webhok info`);
		telegram.get_webhook().then((result) => {
			console.log(result);
		}).catch(e => {
			console.error(e);
		});
	},

	prices: () => {
		Bot.inspect_prices();
	}
};

if(!(command in Commands)) {
	return console.log(`No command: ${command}`);
}

Commands[command](args.slice(1));
