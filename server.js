const utils = require('./utils/env');
utils.assert('TELEGRAM_BOT_TOKEN');

const ngrok = require('ngrok');

const Bot = require('./bot');
const { telegram } = require('./lib/telegram/telegram');

const express = require('express');
const bodyParser = require('body-parser');

const app = express();

// Body parser
app.use(bodyParser.json());

app.post('/', (req, res) => {
	res.sendStatus(200);
	Bot.handle_message(req.body);
});

const port = process.env.PORT || 1234;
app.listen(port, (err) => {
	if(err){
		console.error(err);
		return process.exit(1);
	}

	console.log(`Listening on port ${port}`);
	ngrok.connect(port).then(url => {
		console.log('NGROK ON');
		console.log(url);

		console.log('Setting webhook url for bot...');''
		return telegram.set_webhook(url);
	}).then(() => {
		console.log('OK, ready for messages!');
	}).catch(e => {
		console.error(e);
		process.exit(1);
	});
});
