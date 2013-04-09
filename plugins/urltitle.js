module.exports = {
	onChannelMessage: function(client, server, channel, user, message) {
		var urls = UTIL.findUrls(message);
		if(urls.length > 0) {
			REQUEST(urls[0], function (error, response, body) {
				if (!error && response.statusCode == 200) {
					var $ = CHEERIO.load(body);
					var title = $('title').text();
					title = title.replace(/\n/g, ' ');
					var hostName = UTIL.getHostName(urls[0]);
					client.say(channel.getName(), "Title: " + title + " (" + hostName + ")");
				}
			});
		}
	}
};