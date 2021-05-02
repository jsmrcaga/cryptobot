const bittrex = require('./lib/bittrex/bittrex');
const { telegram, Telegram: { Message }} = require('./lib/telegram/telegram');

const Commands = require('./bot/commands');

class Handler {
	constructor({ chat_id, message }) {
		// If no chat ID is specified, send to myself
		this.chat_id = chat_id || process.env.TELEGRAM_JO_CHAT_ID;
		this.message = message;
	}

	handle_message(message) {
		const { entities=[] } = message;
		const command_positions = entities.filter(({ type }) => type === 'bot_command');

		const { text } = message;
		const commands = command_positions.map(({ offset, length }) => {
			return text.substr(offset, length).replace('/', '');
		});

		if(commands && commands.length) {
			let responses = commands.map(command => {
				return this.handle_command(command);
			});

			// Return list of messages
			return Promise.all(responses).then((results) => {
				return results.map(result => {
					return new Message({
						chat_id: this.chat_id,
						text: result
					});
				});
			});
		}

		// In an array to simplify
		return Promise.resolve([new Message({
			chat_id: this.chat_id,
			text: `I can't understand plain text yet, sorry.`
		})]);
	}

	handle_command(command) {
		return Commands.handle(command, this.message);
	}
}

class Bot {
	handle_message({ message: { chat, sender_chat, ...message } }) {
		if(!chat && !sender_chat) {
			return;
		}

		const chat_id = sender_chat ? sender_chat.id : chat.id;

		const handler = new Handler({ chat_id, message });
		return handler.handle_message(message).then(response_messages => {
			return this.queue_messages(response_messages);	
		}).catch(e => {
			console.error(e);
		});
	}

	queue_messages(messages) {
		// Done
		if(!messages || !messages[0]) {
			return Promise.resolve();
		}

		let new_messages = null;
		if(!Array.isArray(messages)) {
			new_messages = [messages];
		} else {
			new_messages = [...messages];
		}

		// Pop first item
		const first = new_messages.shift();

		return telegram.send_message(first).then(() => {
			return this.queue_messages(new_messages);
		}).catch(e => {
			console.error('Telegram error');
		});
	}

	inspect_prices() {
		return bittrex.tickers().then(products => {
			return products.filter(product => {
				const [, payment] = product.symbol.split('-');
				return payment.toUpperCase() === 'EUR';
			});
		}).then(tickers => {
			const cheap = tickers.filter(({ symbol, lastTradeRate, ...rest }) => {
				const fprice = parseFloat(lastTradeRate);
				return fprice < 0.5;
			});

			if(!cheap) {
				// Do nothing
				return;
			}

			const messages = cheap.map(ticker => {
				return new Message({
					text: `⚠️ Cheap price alert:\n\n${ticker.symbol} is at ${ticker.lastTradeRate}`
				});
			});

			return this.queue_messages(messages);
		}).catch(e => {
			console.error(e);
		});
	}
}

const bot = new Bot();

module.exports = bot;
