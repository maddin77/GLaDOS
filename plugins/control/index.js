var ControlPlugin = function() {};
ControlPlugin.prototype.readableNumber = function(bytes) {
    var suffix = ['B','KB','MB','GB'];
    var i = 0;
    while (bytes > 1024 && i < suffix.length - 1) {
        ++i;
        bytes = Math.round((bytes / 1024) * 100) / 100;
    }
    return (bytes) + " " + suffix[i];
};
ControlPlugin.prototype.onCommand = function(server, channel, cmdName, params, user, msg, text) {
    if(cmdName == "exit") {
        if(!user.hasPermissions()) return user.notice("You don't have the permissions to use this command.");
        this.glados.shutdown();
        return true;
    }
    else if(cmdName == "join") {
        if(!user.hasPermissions()) return user.notice("You don't have the permissions to use this command.");
        if(params.length < 1) return user.notice("!join <Channel>");
        
        var chans = this.cfg.get('irc:channels');
        if( chans.indexOf(params[0]) > -1 ) {
            return user.notice("I'm already in this channel.");
        }

        this.client.join(params[0]);
        chans.push(params[0]);
        this.cfg.set('irc:channels', chans);
        this.cfg.save();
        this.redis.hset("autojoin", params[0], "");
        return true;
    }
    else if(cmdName == "part") {
        if(!user.hasPermissions()) return user.notice("You don't have the permissions to use this command.");
        var chan = params.length < 1 ? channel.getName() : params[0];
        
        var _chans = this.cfg.get('irc:channels');
        var index = _chans.indexOf(chan);
        if( index == -1 ) {
            return user.notice("I'm not in this channel.");
        }

        this.client.part(chan);
        _chans.splice(index, 1);
        this.cfg.set('irc:channels', _chans);
        this.cfg.save();
        this.redis.hdel("autojoin", chan);
        return true;
    }
    else if(cmdName == "mem" || cmdName == "memory") {
        if(!user.hasPermissions()) return user.notice("You don't have the permissions to use this command.");
        var mem = process.memoryUsage();
        user.notice(this.readableNumber(mem.rss) + " (v8: " + this.readableNumber(mem.heapUsed) + " / " + this.readableNumber(mem.heapTotal) + ")");
        return true;
    }
    else if(cmdName == "raw") {
        if(!user.hasPermissions()) return user.notice("You don't have the permissions to use this command.");
        this.client.send(msg);
        return true;
    }
    else if(cmdName == "ping") {
        channel.say("pong");
        return true;
    }
};
ControlPlugin.prototype.onHelp = function(server, user, text) {
    user.say("Provides functions to control the Bot.");
    user.say("Commands: !exit, !join <Channel>, !part [Channel], !memory, !raw, !ping");
};
module.exports = new ControlPlugin();