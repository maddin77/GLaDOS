module.exports = {
	onCommand: function(client, server, channel, commandChar, name, params, user, text, message) {
		if(name == "facepalm" || name == "fp") {
			REQUEST("http://facepalm.org/img.php", function (error, response, body) {
				var img = "http://facepalm.org/" + response.req.path;
				client.say(channel.getName(), user.getNick() + ": " + img);
			});
		}
	}
};