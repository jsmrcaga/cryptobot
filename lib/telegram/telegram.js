const fishingrod = require('fishingrod');

class Telegram {
	constructor({ token=null }={}) {
		this.token = token || process.env.TELEGRAM_BOT_TOKEN;
	}

	request({ method='GET', path='/', body, headers={} }) {
		if(method === 'POST' && body) {
			headers = {
				...headers,
				'Content-Type': 'application/json'
			};
		}
		return fishingrod.fish({
			method,
			path: `/bot${this.token}${path}`,
			host: 'api.telegram.org',
			data: body ? JSON.stringify(body) : undefined,
			headers,
		}).then(({ status, headers, response }) => {
			if(status < 200 || status > 299) {
				console.error(response);
				throw new Error(`Telegram API Error (${status})`);
			}

			return JSON.parse(response);
		});
	}

	set_webhook(url) {
		return this.request({
			method: 'POST',
			path: '/setWebhook',
			body: {
				url
			}
		});
	}

	send_message(message) {
		return this.request({
			method: 'POST',
			path: '/sendMessage',
			body: message,
		})
	}
}

class Message {
	constructor({ chat_id, text, reply_markup }) {
		this.chat_id = chat_id || process.env.TELEGRAM_JO_CHAT_ID;
		this.text = text;
		this.reply_markup = reply_markup;
	}
}

Telegram.Message = Message;

const telegram = new Telegram();
module.exports = { telegram, Telegram };
