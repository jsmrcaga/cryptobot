const argumentate = require('argumentate');
const bittrex = require('../lib/bittrex/bittrex');

const Commands = {
	price: ({ options, variables }, message) => {
		const item = message.text.replace('/price', '').trim();
		return bittrex.ticker({
			product_id: `${item.toUpperCase()}-EUR`
		}).then(ticker => {
			return `💵 Price for ${item.toUpperCase()}: ${ticker.lastTradeRate}€`;
		}).catch(e => {
			return `Could not get price for "${item}"`;
		});
	},
	tickers: ({ options: { price_lt, currency }}) => {
		return bittrex.tickers().then(tickers => {
			if(currency) {
				tickers = tickers.filter(ticker => {
					const [, curr] = ticker.symbol.split('-');
					return curr === currency.toUpperCase();
				});
			}

			if(price_lt) {
				tickers = tickers.filter(ticker => parseFloat(ticker.askRate) < price_lt);
			}

			if(!tickers.length) {
				return 'No prices match those filters';
			}

			return tickers.map(ticker => {
				return `${ticker.symbol}: ${ticker.lastTradeRate}`;
			}).join('\n');
		});
	}
};

class CommandHandler {
	handle(command, message) {
		if(!Commands[command]) {
			return Promise.reject(`❌ No command named "${command}"`);
		}

		const args = argumentate(message.text.split(' '));
		return Commands[command](args, message);
	}
}

const handler = new CommandHandler();
module.exports = handler;
