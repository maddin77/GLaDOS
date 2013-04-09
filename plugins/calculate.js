module.exports = {
	onCommand: function(client, server, channel, commandChar, name, params, user, text, message) {
		if(name == "c" || name == "calc" || name == "calculate") {
			if(params.length < 1) return client.notice(user.getNick(), commandChar + name + " <term>");
			var url = "https://www.google.com/ig/calculator?hl=de&q=" + encodeURIComponent(text);
			REQUEST(url, function (error, response, body) {
				if (!error && response.statusCode == 200) {
					try {
						var result = eval("("+body+")");
						result.rhs = result.rhs.replace(new RegExp(String.fromCharCode(65533), "g"), " ");
						client.say(channel.getName(), user.getNick() + ": " + (result.rhs || 'Could not compute.'));
					}
					catch(e) {}
				}
			});
		}
	},
	onResponseMessage: function(client, server, channel, user, message) {
		message.rmatch("^(rechne|wie viel ist) (.*)", function(match) {
			var url = "https://www.google.com/ig/calculator?hl=de&q=" + encodeURIComponent(match[2]);
			REQUEST(url, function (error, response, body) {
				if (!error && response.statusCode == 200) {
					try {
						var result = eval("("+body+")");
						result.rhs = result.rhs.replace(new RegExp(String.fromCharCode(65533), "g"), " ");
						client.say(channel.getName(), user.getNick() + ": " + (result.rhs || 'Could not compute.'));
					}
					catch(e) {}
				}
			});
		});
	}
};