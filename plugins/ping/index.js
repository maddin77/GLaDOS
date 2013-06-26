module.exports = {
    /*==========[ +INFO+ ]==========*/
    info: {
        description: "Prüft ob der Bot noch reagiert.",
        commands: ["{N} ?", "{N} ping", "!ping", ".ping", ",ping"]
    },
    /*==========[ -INFO- ]==========*/

    onResponseMessage: function(client, server, channel, user, message) {
        if(message == "?") {
            client.say(channel.getName(), user.getNick() + ": Ja?");
        }
        else if(message == "ping") {
            client.say(channel.getName(), "pong");
        }
    },
    onCommand: function(client, server, channel, commandChar, name, params, user, text, message) {
        if(name == "ping") {
            client.say(channel.getName(), "pong");
            return true;
        }
    },
    onChannelMessage: function(client, server, channel, user, message) {
        message.rmatch("^(.ping|,ping)", function(match) {
            client.say(channel.getName(), "pong");
        });
    }
};