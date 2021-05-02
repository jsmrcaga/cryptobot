#!/usr/bin/env node
const chalk = require('chalk');
const { options, variables } = require('argumentate')(process.argv.slice(2));
const utils = require('./utils/env');
utils.assert('TELEGRAM_BOT_TOKEN');

const Bot = require('./bot');
const { telegram } = require('./lib/telegram/telegram');
const Bittrex = require('./lib/bittrex/bittrex');

const Ticker = require('./cli/models/ticker');

const [command] = variables;

const Commands = {
	webhook: ({ options, variables }) => {
		const [url] = variables;
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
	},

	tickers: ({ options: { price_lt, currency }}) => {
		Bittrex.tickers().then(tickers => {
			if(currency) {
				tickers = tickers.filter(ticker => {
					const [, curr] = ticker.symbol.split('-');
					return curr === currency.toUpperCase();
				});
			}

			if(price_lt) {
				console.log(chalk.gray(`Filtering on askRate <`), `${price_lt} ${currency}`);
				tickers = tickers.filter(ticker => parseFloat(ticker.askRate) < price_lt);
			}

			if(!tickers.length) {
				return console.log(chalk.red('No prices match those filters'));
			}

			const output = tickers.map(ticker => (new Ticker(ticker)).toStdout()).join('\n')
			console.log(output);
		}).catch(e => {
			console.error(chalk.red('Could not get tickers'));
			console.error(e);
		});
	}
};

if(!(command in Commands)) {
	return console.log(`No command: ${command}`);
}

Commands[command]({ options, variables: variables.slice(1) });
