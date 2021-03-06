const Bot = require('./bot');

class Response {
	constructor({ status=200, body, headers={'Content-Type': 'application/json'} }) {
		this.statusCode = status;
		this.isBase64Encoded = true;
		this.headers = headers;

		const str_body = body instanceof Object ? JSON.stringify(body) : body;
		this.body = Buffer.from(str_body).toString('base64');
	}
}

function handle_lambda(event, context) {
	// If shceduled: cehck for prices and send potential buys to bot
	// If POST apigateway: check for message and do whatever it wants
	const { source } = event;

	// "source": "aws.events" means CloudWatch Events
	if(source && source === 'aws.events') {
		return Bot.inspect_prices().then(() => {
			console.log('Messages sent!');
		});
	}

	const { body, isBase64Encoded, requestContext: { http: { method }}} = event;

	if(method !== 'POST') {
		// Respond with 400
		return Promise.resolve(new Response({
			status: 405,
			body: {
				error: 'Method not allowed'
			}
		}));
	}

	let data = isBase64Encoded ? Buffer.from(body, 'base64') : body;
	data = JSON.parse(data);

	Bot.handle_message(data).then(() => {
		// Wait until telegram messages have been scheduled
		return Promise.resolve(new Response({
			status: 200,
			body: 'OK'
		}));
	});
}

module.exports = { handle_lambda };
