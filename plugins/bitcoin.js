module.exports = {
	onCommand: function(client, server, channel, commandChar, name, params, user, text, message) {
		if(name == "bitcoin") {
			REQUEST("http://data.mtgox.com/api/2/BTCEUR/money/ticker", function (error, response, body) {
				if (!error && response.statusCode == 200) {
					var bitcoin = JSON.parse(body);
					if(bitcoin.result == "success") {
						var buy = bitcoin.data.buy.value;
						var sell = bitcoin.data.sell.value;
						if(params.length === 0) {
							client.say(channel.getName(), user.getNick() + ": Kaufen: " + buy + "€/BTC, Verkaufen: " + sell + "€/BTC (data from www.mtgox.com)");
						}
						else {
							client.say(channel.getName(), user.getNick() + ": Kaufen: " + (buy*parseFloat(params[0])) + " €, Verkaufen: " + (sell*parseFloat(params[0])) + " € (data from www.mtgox.com)");
						}
					}
					else {
						client.notice(user.getNick(), bitcoin.error);
					}
				}
			});
		}
	},
	onResponseMessage: function(client, server, channel, user, message) {
		message.rmatch("^bitcoin(s)?( kurs)?", function(match) {
			REQUEST("http://data.mtgox.com/api/2/BTCEUR/money/ticker", function (error, response, body) {
				if (!error && response.statusCode == 200) {
					var bitcoin = JSON.parse(body);
					if(bitcoin.result == "success") {
						var buy = bitcoin.data.buy.value;
						var sell = bitcoin.data.sell.value;
						client.say(channel.getName(), user.getNick() + ": Kaufen: " + buy + "€/BTC, Verkaufen: " + sell + "€/BTC (data from www.mtgox.com)");
					}
					else {
						client.notice(user.getNick(), bitcoin.error);
					}
				}
			});
		});
	}
};