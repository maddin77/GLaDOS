module.exports = {
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
    },
    onHelpRequest: function(client, server, user, message, parts) {
        client.say(user.getNick(), "# Beschreibung:");
        client.say(user.getNick(), "#   Prüft ob der Bot noch reagiert.");
        client.say(user.getNick(), "# Verwendung:");
        client.say(user.getNick(), "#   !ping");
        client.say(user.getNick(), "#   .ping");
        client.say(user.getNick(), "#   ,ping");
        client.say(user.getNick(), "#   " + CONFIG.get('irc:nick') + "?");
        client.say(user.getNick(), "#   " + CONFIG.get('irc:nick') + " ping");
    }
};