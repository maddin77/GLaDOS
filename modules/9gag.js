module.exports = {
	onCommand: function(client, server, channel, commandChar, name, params, user, text, message) {
		if(name == "9gag") {
			REQUEST("http://9gag.com/random", function (error, response, body) {
				if (!error && response.statusCode == 200) {
					var $ = CHEERIO.load(body);
					var src = $(".img-wrap img").attr('src');
					var img_src = "http:"+src;
					client.say(channel.getName(), user.getNick() + ": " + img_src);
				}
			});
		}
	},
	onResponseMessage: function(client, server, channel, user, message) {
		message.rmatch("^9gag", function(match) {
			REQUEST("http://9gag.com/random", function (error, response, body) {
				if (!error && response.statusCode == 200) {
					var $ = CHEERIO.load(body);
					var src = $(".img-wrap img").attr('src');
					var img_src = "http:"+src;
					client.say(channel.getName(), user.getNick() + ": " + img_src);
				}
			});
		});
	}
};