module.exports = {
	onCommand: function(client, server, channel, commandChar, name, params, user, text, message) {
		if(name == "bing") {
			var url = "http://www.bing.com/search?q=" + encodeURIComponent(text);
			REQUEST(url, function (error, response, body) {
				if (!error && response.statusCode == 200) {
					var $ = CHEERIO.load(body);
					var link = $('.sb_tlst h3 a').attr('href');
					client.say(channel.getName(), user.getNick() + ": " + link);
				}
			});
		}
	},
	onResponseMessage: function(client, server, channel, user, message) {
		message.rmatch("^(such nach|suche nach|such|suche) (.*)", function(match) {
			var url = "http://www.bing.com/search?q=" + encodeURIComponent(match[2]);
			REQUEST(url, function (error, response, body) {
				if (!error && response.statusCode == 200) {
					var $ = CHEERIO.load(body);
					var link = $('.sb_tlst h3 a').attr('href');
					client.say(channel.getName(), user.getNick() + ": " + link);
				}
			});
		});
	}
};