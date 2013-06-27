module.exports = {
    /*==========[ +INFO+ ]==========*/
    info: {
        description: "-",
        commands: ["{C}exit", "{C}restart", "{C}join <Channel>", "{C}part [Channel]", "{C}memory", "{C}raw", "{C}ping"]
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
            var _tmp = CONFIG.get('irc:channels');
            _tmp.push(params[0]);
            CONFIG.set('irc:channels', _tmp);
            CONFIG.save();
            return true;
        }
        else if(name == "part") {
            if(!user.hasPermissions()) return client.notice(user.getNick(), "Du hast nicht die nötigen Rechte dazu.");
            var chan = params.length < 1 ? channel.getName() : params[0];
            client.part(chan);
            var _tmp = CONFIG.get('irc:channels');
            var i = _tmp.indexOf( chan );
            if( i != -1 ) {
                _tmp.splice(i, 1);
            }
            CONFIG.set('irc:channels', _tmp);
            CONFIG.save();
            return true;
        }
        else if(name == "memory") {
            if(!user.hasPermissions()) return client.notice(user.getNick(), "Du hast nicht die nötigen Rechte dazu.");
            var mem = process.memoryUsage();
            client.notice(user.getNick(), UTIL.readableNumber(mem.rss) + " (v8: " + UTIL.readableNumber(mem.heapUsed) + " / " + UTIL.readableNumber(mem.heapTotal) + ")");
            return true;
        }
        else if(name == "raw") {
            if(!user.hasPermissions()) return client.notice(user.getNick(), "Du hast nicht die nötigen Rechte dazu.");
            client.send(text);
            return true;
        }
        else if(name == "ping") {
            client.say(channel.getName(), "pong");
            return true;
        }
    }
};
