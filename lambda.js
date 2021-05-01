const Bot = require('./bot');

class Response {
	constructor({ status=200, body, headers={'Content-Type': 'application/json'} }) {
		this.statusCode = status;
		this.body = Buffer.from(body).toString('base64');
		this.isBase64Encoded = true;
		this.headers = headers;
	}
}

function handle_lambda(event, context) {
	// If shceduled: cehck for prices and send potential buys to bot
	// If POST apigateway: check for message and do whatever it wants
	const { source, httpMethod, path, headers, queryStringParameters, body, isBase64Encoded } = event;

	// "source": "aws.events" means CloudWatch Events
	if(source && source === 'aws.events') {
		return Bot.inspect_prices();
	}

	if(httpMethod !== 'POST') {
		// Respond with 400
		return Promise.resolve(new Response({
			status: 405,
			body: {
				error: 'Method not allowed'
			}
		}));
	}

	let data = isBase64Encoded ? Buffer.from(data, 'base64') : data;
	data = JSON.parse(data);

	return Bot.handle_message(data).then(result => {
		return new Response({
			body: result
		});
	});
}

module.exports = { handle_lambda };
