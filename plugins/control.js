module.exports = {
    onCommand: function(client, server, channel, commandChar, name, params, user, text, message) {
        if(name == "exit" && user.hasPermissions()) {
            QUIT(1);
        }
        if(name == "restart" && user.hasPermissions()) {
            QUIT(0);
        }
    },
    onHelpRequest: function(client, server, user, message, parts) {
        client.say(user.getNick(), "# Beschreibung:");
        client.say(user.getNick(), "#   -");
        client.say(user.getNick(), "# Verwendung:");
        client.say(user.getNick(), "#   !exit");
        client.say(user.getNick(), "#   !restart");
    }
};