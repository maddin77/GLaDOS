module.exports = {
    onCommand: function(client, server, channel, commandChar, name, params, user, text, message) {
        if(name == "exit") {
            if(!user.hasPermissions()) return client.notice(user.getNick(), "Du hast nicht die nötigen Rechte dazu.");
            QUIT(1);
            return true;
        }
        else if(name == "restart") {
            if(!user.hasPermissions()) return client.notice(user.getNick(), "Du hast nicht die nötigen Rechte dazu.");
            QUIT(0);
            return true;
        }
        else if(name == "join") {
            if(!user.hasPermissions()) return client.notice(user.getNick(), "Du hast nicht die nötigen Rechte dazu.");
            if(params.length < 1) return client.notice(user.getNick(), commandChar + name + " <Channel>");
            client.join(params[0]);
            return true;
        }
        else if(name == "part") {
            if(!user.hasPermissions()) return client.notice(user.getNick(), "Du hast nicht die nötigen Rechte dazu.");
            var chan = params.length < 1 ? channel.getName() : params[0];
            client.part(chan);
            return true;
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