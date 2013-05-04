module.exports = {
    onCommand: function(client, server, channel, commandChar, name, params, user, text, message) {
        if(name == "memory" && user.hasPermissions()) {
            var mem = process.memoryUsage();
            client.notice(user.getNick(), UTIL.readableNumber(mem.rss) + " (v8: " + UTIL.readableNumber(mem.heapUsed) + " / " + UTIL.readableNumber(mem.heapTotal) + ")");
            return true;
        }
    },
    onHelpRequest: function(client, server, user, message, parts) {
        client.say(user.getNick(), "# Beschreibung:");
        client.say(user.getNick(), "#   Zeigt die aktuelle Speicherausnutzung an.");
        client.say(user.getNick(), "# Verwendung:");
        client.say(user.getNick(), "#   !memory");
    }
};