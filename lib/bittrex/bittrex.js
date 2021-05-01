const fishingrod = require('fishingrod');

class BittrexClient {
	request({ method='GET', path='/', headers={}, body}) {
		return fishingrod.fish({
			method,
			path: `/v3${path}`,
			host: 'api.bittrex.com',
			data: body,
			headers: {
				...headers,
				'User-Agent': 'crypto-bot-jsmrcaga'
			},
		}).then(({ status, headers, response }) => {
			if(status < 200 || status > 299) {
				console.error(response);
				throw new Error(`Coinbase PRO API Error (${status})`);
			}

			return JSON.parse(response);
		});
	}

	tickers(filter={}) {
		return this.request({ path: '/markets/tickers' }).then(products => {
			if(!Object.keys(filter).length) {
				return products;
			}

			// Filter every product by the filters given
			return products.filter(product => {
				return Object.entries(filter).every(([k,v]) => product[k] === v);
			});
		})
	}

	ticker({ product_id }) {
		return this.request({ path: `/markets/${product_id}/ticker` });
	}
}

const client = new BittrexClient();
module.exports = client;
