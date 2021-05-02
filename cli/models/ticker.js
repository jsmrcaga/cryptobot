const chalk = require('chalk');

class Ticker {
	constructor(api) {
		this.object = api;
	}

	toStdout() {
		const { symbol, lastTradeRate, askRate, bidRate } = this.object;
		return `
	${chalk.bold(symbol)}:
		${chalk.gray('Ask')}: ${askRate}
		${chalk.gray('Last Trade')}: ${lastTradeRate}
		${chalk.gray('Bid')}: ${bidRate}
		`;
	}
}

module.exports = Ticker;
