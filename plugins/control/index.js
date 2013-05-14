module.exports = {
    /*==========[ +INFO+ ]==========*/
    info: {
        description: "-",
        commands: ["{C}exit", "{C}restart", "{C}join <Channel>", "{C}part [Channel]", "{C}memory"]
    },
    /*==========[ -INFO- ]==========*/

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
        else if(name == "memory" && user.hasPermissions()) {
            var mem = process.memoryUsage();
            client.notice(user.getNick(), UTIL.readableNumber(mem.rss) + " (v8: " + UTIL.readableNumber(mem.heapUsed) + " / " + UTIL.readableNumber(mem.heapTotal) + ")");
            return true;
        }
    }
};
