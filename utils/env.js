// Load env
const ngrok = require('ngrok');
const fs = require('fs');
const file = fs.readFileSync('./.env').toString('utf8');
const envs = file.split('\n').map(line => line.split('=')).map(([k, v]) => process.env[k] = v);

if(!process.env.TELEGRAM_BOT_TOKEN) {
	console.error('NO TOKEN', process.env);
	process.exit(1);
}

module.exports = {
	assert: (values) => {
		if(!Array.isArray(values)) {
			values = [values];
		}

		const missing = [];
		for(value of values) {
			if(!(value in process.env)) {
				missing.push(value);
			}
		}

		if(missing.length) {
			console.error(`Missing environment variables: ${missing.join(', ')}`)
			process.exit(1);
		}
	}
};
