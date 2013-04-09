module.exports = {
	onCommand: function(client, server, channel, commandChar, name, params, user, text, message) {
		if(name == "kick" || name == "k") {
			if( !user.hasMinMode("%") ) return client.notice(user.getNick(), "Du hast nicht die nötigen rechte dazu.");
			if( !getUser.getUser(client.nick).hasMinMode("%") ) return client.notice(user.getNick(), "Ich habe nicht die nötigen rechte dazu.");
			if( params.length === 0 ) return client.notice(user.getNick(), commandChar + name + " <Nick> [Grund]");
			var _nick = params[0];
			var _user = getUser.getUser(_nick);
			if(_user === null) return client.notice(user.getNick(), "\"" + _nick + "\" existiert nicht.");
			var reason = "";
			if( params.length > 1 ) {
				reason = text.slice(_user.getNick().length+1);
			}
			else {
				reason = "-";
			}
			client.send('KICK', channel.getName(), _user.getNick(), "(" + user.getNick() + ") " + reason);
		}
	}
};