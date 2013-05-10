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
    onChannelMessage: function(client, server, channel, user, message) {
        message.rmatch("^(!ping|.ping|,ping)", function(match) {
            client.say(channel.getName(), "pong");
        });
    }
};