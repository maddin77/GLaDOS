var GLaDOS = module.exports = function(configFile) {
    var that = this;

    this.cfg = require('nconf').file('', {json_spacing: 4, file: configFile});

    this.redis = require("redis").createClient(this.cfg.get('redis:port'), this.cfg.get('redis:host'));
    this.redis.auth(this.cfg.get('redis:pass'));
    this.redis.on("error", function(err){that.redisError(err);});

    var logentries = require('node-logentries').logger({
        token: this.cfg.get('logentries')
    });
    
    var winston = require('winston');
    logentries.winston( winston );

    this.logger = new (winston.Logger)({
        transports: [
            new (winston.transports.Console)({colorize: true, timestamp: true})
        ]
    });
    this.logger.setLevels(winston.config.npm.levels);

    var IRC = require('irc');
    this.client = new IRC.Client(this.cfg.get('irc:server'), this.cfg.get('irc:nick'), this.cfg.get('irc'));
    this.client.addListener('registered', function(message) {
        that.irc_registered(message);
    });
    this.client.addListener('motd', function(motd) {
        that.irc_motd(motd);
    });
    this.client.addListener('names', function(channel, nicks) {
        that.irc_names(that.server.getChannel(channel), nicks);
    });
    this.client.addListener('topic', function(channel, topic, nick, message) {
        that.irc_topic(that.server.getChannel(channel), topic, nick, message);
    });
    this.client.addListener('join', function(channel, nick, message) {
        that.irc_join(that.server.getChannel(channel), that.server.getUser(nick), message);
    });
    this.client.addListener('part', function(channel, nick, reason, message) {
        that.irc_part(that.server.getChannel(channel), that.server.getUser(nick), reason, message);
    });
    this.client.addListener('quit', function(nick, reason, channels, message) {
        that.irc_quit(that.server.getUser(nick), reason, channels, message);
    });
    this.client.addListener('kick', function(channel, user, by, reason, message) {
        that.irc_kick(that.server.getChannel(channel), that.server.getUser(user), that.server.getUser(by), reason || "", message);
    });
    this.client.addListener('kill', function(nick, reason, channels, message) {
        that.irc_kill(that.server.getUser(nick), reason, channels, message);
    });
    this.client.addListener('pm', function(nick, text, message) {
        that.irc_privateMessage(that.server.getUser(nick), text, message);
    });
    this.client.addListener('message#', function(nick, to, text, message) {
        that.irc_channelMessage(that.server.getUser(nick), that.server.getChannel(to), text, message);
    });
    this.client.addListener('notice', function(nick, to, text, message) {
        that.irc_notice(nick ? that.server.getUser(nick) : null, to, text, message);
    });
    this.client.addListener('action', function(nick, to, text) {
        that.irc_action(that.server.getUser(nick), to, text);
    });
    this.client.addListener('ping', function(server) {
        that.irc_ping();
    });
    this.client.addListener('ctcp', function(from, to, text, type) {
        that.irc_ctcp(from, to, text, type);
    });
    this.client.addListener('ctcp-version', function(from, to) {
        that.client.ctcp(from, "notice", "VERSION " + that.cfg.get('version'));
    });
    this.client.addListener('nick', function(oldnick, newnick, channels, message) {
        that.irc_nick(oldnick, newnick, channels, message);
    });
    this.client.addListener('invite', function(channel, from, message) {
        that.irc_invite(that.server.getChannel(channel), that.server.getUser(from));
    });
    this.client.addListener('+mode', function(channel, by, mode, argument, message) {
        that.irc_mode(that.server.getChannel(channel), that.server.getUser(by), mode, argument, true);
    });
    this.client.addListener('-mode', function(channel, by, mode, argument, message) {
        that.irc_mode(that.server.getChannel(channel), that.server.getUser(by), mode, argument, false);
    });
    this.client.addListener('whois', function(info) {
        that.irc_whois(info);
    });
    this.client.addListener('channellist_item', function(info) {
        that.irc_channelListItem(info);
    });
    this.client.addListener('error', function(message) {
        that.irc_error(message);
    });

    var Server = require('./server.js');
    this.server = new Server(this.cfg.get('irc:server'), this.client, this.cfg);

    var PluginManager = require('./pluginManager.js');
    this.pluginManager = new PluginManager(this, this.client, this.logger, this.redis);

    process.on('uncaughtException', function (err) {
        that.uncaughtException(err);
    });

    process.on('SIGINT', function() {
        that.shutdown();
    });

    require('fs').readdir("./plugins", function(err, files) {
        files.forEach(function(file) {
            if(file == "README.md" || file[0] == "_") return;
            that.pluginManager.loadPlugin(file);
        });
    });
};
GLaDOS.prototype.uncaughtException = function(err) {
    this.logger.error("Caught exception: "+ err);
    this.logger.error(err.stack);
    this.logger.error("Shutting down.");
    this.shutdown();
};
GLaDOS.prototype.shutdown = function() {
    this.logger.info("unloading plugins...");
    this.pluginManager.unloadAll();

    this.logger.info("disconnecting from irc server...");
    this.client.disconnect( this.cfg.get('quitMSG') );

    this.logger.info("disconnecting from redis server...");
    this.redis.quit();
    var that = this;
    setTimeout(function() {
        that.logger.info("Shutting down.");
        process.exit(0);
    }, 1000);
};
GLaDOS.prototype.redisError = function(err) {
    this.logger.error("Redis error: "+ err);
};

GLaDOS.prototype.irc_registered = function(message) {
    this.logger.info(message.args.join(' '));
};
GLaDOS.prototype.irc_motd = function(motd) {
    this.logger.info(motd);
    this.server.setMotd(motd);
    this.client.notice("NickServ", "identify " + this.cfg.get('irc:password'));
    this.client.list();

    var that = this;

    this.redis.hgetall("autojoin", function(err, obj) {
        if(!err && obj) {
            Object.keys(obj).forEach(function(channel) {
                that.client.join(channel);
                if(obj[channel].length > 0) {
                    obj[channel].split(",").forEach(function(plugin) {
                        that.pluginManager.disablePLugin(plugin, channel);
                    });
                }
            });
        }
    });
};
GLaDOS.prototype.irc_names = function(channel, nicks) {
    var nickList = [];
    for (var nick in nicks) {
        if(nicks[nick] == "~" || nicks[nick] == "&" || nicks[nick] == "@" || nicks[nick] == "%" || nicks[nick] == "+") {
            channel.addUserMode(nick, nicks[nick]);
        }
        nickList.push(nicks[nick] + nick);
        this.server.getUser(nick).whois();
    }
    this.logger.info('[%s] User : %s', channel.getName(), nickList.join(", "));
};
GLaDOS.prototype.irc_topic = function(channel, topic, nick, message) {
    var date = new Date(message.args[3]*1000);
    channel.setTopic({
        "nick": nick,
        "topic": topic,
        "time": date
    });
    this.logger.info('[%s] Topic: %s', channel.getName(), topic);
    this.logger.info('[%s] Topic set by %s. (%s)', channel.getName(), nick, date.toString());
};
GLaDOS.prototype.irc_join = function(channel, user, message) {
    this.logger.info('[%s] %s has joined.', channel.getName(), user.getNick());
    channel.setUserCount("++");
    if(user.getNick() != this.client.nick) {
        user.whois();
    }
    for(var p in this.pluginManager.plugins) {
        var pl = this.pluginManager.plugins[p];
        if(typeof pl.onJoin !== 'undefined' && !this.pluginManager.isDisabled(p, channel.getName())) {
            pl.onJoin(this.server, channel, user);
        }
    }
};
GLaDOS.prototype.irc_part = function(channel, user, reason, message) {
    this.logger.info('[%s] %s has left (%s).', channel.getName(), user.getNick(), reason);
    channel.setUserCount("--");
    for(var p in this.pluginManager.plugins) {
        var pl = this.pluginManager.plugins[p];
        if(typeof pl.onPart !== 'undefined' && !this.pluginManager.isDisabled(p, channel.getName())) {
            pl.onPart(this.server, channel, user, reason);
        }
    }
};
GLaDOS.prototype.irc_quit = function(user, reason, channels, message) {
    this.logger.info('%s has quit (%s)', user.getNick(), reason);
    user.setOffline();
    for(var i=0; i<channels.length; i++) {
        this.server.getChannel(channels[i]).setUserCount("--");
    }
    for(var p in this.pluginManager.plugins) {
        var pl = this.pluginManager.plugins[p];
        if(typeof pl.onQuit !== 'undefined') {
            pl.onQuit(this.server, user, channels, reason);
        }
    }
};
GLaDOS.prototype.irc_kick = function(channel, user, by, reason, message) {
    this.logger.info('[%s] %s has kicked %s (%s).', channel.getName(), by.getNick(), user.getNick(), reason);
    channel.setUserCount("--");
    for(var p in this.pluginManager.plugins) {
        var pl = this.pluginManager.plugins[p];
        if(typeof pl.onKick !== 'undefined' && !this.pluginManager.isDisabled(p, channel.getName())) {
            pl.onKick(this.server, channel, user, by, reason);
        }
    }
};
GLaDOS.prototype.irc_kill = function(user, reason, channels, message) {
    this.logger.info('%s has been killed (%s)', user.getNick(), reason);
    user.setOffline();
    for(var i=0; i<channels.length; i++) {
        this.server.getChannel(channels[i]).setUserCount("--");
    }
    for(var p in this.pluginManager.plugins) {
        var pl = this.pluginManager.plugins[p];
        if(typeof pl.onKill !== 'undefined') {
            pl.onKill(this.server, user, channels, reason);
        }
    }
};
GLaDOS.prototype.irc_privateMessage = function(user, text, message) {
    this.logger.info('[PM] %s: %s', user.getNick(), text);
    var parts = text.split(" ");
    if(parts[0].toLowerCase() == "help") {
        if(parts.length == 1) {
            user.say("***** " + this.client.nick + " Help *****");
            user.say("Hi! I am " + this.client.nick + ". I react on defined commands or interactions in a Channel.");
            user.say(" ");
            user.say("For more information on a function, type:");
            user.say("/msg " + this.client.nick + " HELP <plugin>");
            user.say(" ");
            user.say("The following functions are available:");
            user.say(this.pluginManager.getAllAsString(", ") || "-");
            user.say("***** " + this.client.nick + " Help *****");
        }
        else {
            if(!this.pluginManager.exist(parts[1])) {
                user.say("No Help available for '" + parts[1] + "'.");
            }
            else {
                var pl_ = this.pluginManager.plugins[parts[1]];
                if(typeof pl_.onHelp !== 'undefined') {
                    pl_.onHelp(this.server, user, text);
                }
                else {
                    user.say("No Help available for '" + parts[1] + "'.");
                }
            }
        }
    }
    else {
        for(var p in this.pluginManager.plugins) {
            var pl = this.pluginManager.plugins[p];
            if(typeof pl.onPrivateMessage !== 'undefined') {
                pl.onPrivateMessage(this.server, user, text);
            }
        }
    }
};
GLaDOS.prototype.irc_channelMessage = function(user, channel, text, message) {
    this.logger.info('[%s] %s: %s', channel.getName(), user.getNick(), text);
    if( text.indexOf( '!' ) === 0 ) {
        var cmdName = text.split(" ")[0].substr(1).toLowerCase();
        var msg = text.substr(cmdName.length+2);
        var params = msg.split(" ");
        if(params.length == 1 && params[0] === "") {
            params = [];
        }
        this.logger.debug('[CMD] %s|%s|%s|%s', cmdName, params, msg, text);

        for(var p in this.pluginManager.plugins) {
            var pl = this.pluginManager.plugins[p];
            if(typeof pl.onCommand !== 'undefined' && !this.pluginManager.isDisabled(p, channel.getName())) {
                pl.onCommand(this.server, channel, cmdName, params, user, msg, text);
            }
        }
    }
    else {
        if(text.lastIndexOf(this.client.nick, 0) === 0) {
            var _text = text.slice(this.client.nick.length);
            if(_text[0] == ":") {
                _text = _text.slice(1);
            }
            if(_text[0] == " ") {
                _text = _text.slice(1);
            }
            for(var _p in this.pluginManager.plugins) {
                var _pl = this.pluginManager.plugins[_p];
                if(typeof _pl.onResponseMessage !== 'undefined' && !this.pluginManager.isDisabled(_p, channel.getName())) {
                    _pl.onResponseMessage(this.server, channel, user, _text);
                }
            }
        }
        for(var __p in this.pluginManager.plugins) {
            var __pl = this.pluginManager.plugins[__p];
            if(typeof __pl.onChannelMessage !== 'undefined' && !this.pluginManager.isDisabled(__p, channel.getName())) {
                __pl.onChannelMessage(this.server, channel, user, text);
            }
        }
    }
};
GLaDOS.prototype.irc_notice = function(user, to, text, message) {
    if( user === null ) {
        this.logger.info('[%s] %s', this.cfg.get('irc:server'), text);
    } else {
        this.logger.info('[W] %s: %s', user.getNick(), text);
        for(var p in this.pluginManager.plugins) {
            var pl = this.pluginManager.plugins[p];
            if(typeof pl.onNotice !== 'undefined') {
                pl.onNotice(this.server, user, to, text);
            }
        }
    }
};
GLaDOS.prototype.irc_action = function(user, to, text) {
    this.logger.info('[%s] * %s %s', to, user.getNick(), text);
    for(var p in this.pluginManager.plugins) {
        var pl = this.pluginManager.plugins[p];
        if(typeof pl.onAction !== 'undefined') {
            pl.onAction(this.server, user, to, text);
        }
    }
};
GLaDOS.prototype.irc_ping = function() {
    this.logger.info('[%s] - Ping/Pong', this.server.ip);
    this.server.lastping = new Date();
    for(var p in this.pluginManager.plugins) {
        var pl = this.pluginManager.plugins[p];
        if(typeof pl.onPing !== 'undefined') {
            pl.onPing(this.server);
        }
    }
};
GLaDOS.prototype.irc_ctcp = function(from, to, text, type) {
    if(text.substr(0, 6) == "ACTION") return; //filter ACTIONS
    this.logger.info('[CTCP] %s > %s: %s', from, to, text);
    for(var p in this.pluginManager.plugins) {
        var pl = this.pluginManager.plugins[p];
        if(typeof pl.onCTCP !== 'undefined') {
            pl.onCTCP(this.server, from, to, text, type);
        }
    }
};
GLaDOS.prototype.irc_nick = function(oldnick, newnick, channels, message) {
    this.logger.info('%s is now known as %s.', oldnick, newnick);
    var user = this.server.getUser(oldnick);
    user.setNick(newnick);
    for(var p in this.pluginManager.plugins) {
        var pl = this.pluginManager.plugins[p];
        if(typeof pl.onNick !== 'undefined') {
            pl.onNick(this.server, channels, user, oldnick, newnick);
        }
    }
};
GLaDOS.prototype.irc_invite = function(channel, user) {
    this.logger.info('%s invites you to join %s.', user.getNick(), channel.getName());
    for(var p in this.pluginManager.plugins) {
        var pl = this.pluginManager.plugins[p];
        if(typeof pl.onInvite !== 'undefined') {
            pl.onInvite(this.server, channel, user);
        }
    }
};
GLaDOS.prototype.irc_mode = function(channel, user, mode, argument, add) {
    if (typeof argument !== 'undefined') {
        if(add) channel.addUserMode(argument, mode);
        else channel.remUserMode(argument, mode);

        if(channel.userExistInChannel(argument)) {
            this.server.getUser(argument).whois();
        }

        this.logger.info('[%s] %s sets modes: %s%s %s', channel.getName(), user.getNick(), add?'+':'-', mode, argument);
    }
    else {
        channel.setMode(mode);
        this.logger.info('[%s] %s sets modes: %s%s', channel.getName(), user.getNick(), add?'+':'-', mode);
    }
    for(var p in this.pluginManager.plugins) {
        var pl = this.pluginManager.plugins[p];
        if(typeof pl.onMode !== 'undefined' && !this.pluginManager.isDisabled(p, channel.getName())) {
            pl.onMode(this.server, channel, user, mode, argument, add);
        }
    }
};
GLaDOS.prototype.irc_whois = function(info) {
    var user = this.server.getUser(info.nick);

    if(info.hasOwnProperty('user')) user.setUserName(info.user);
    if(info.hasOwnProperty('host')) user.setHost(info.host);
    if(info.hasOwnProperty('server')) user.setServer(info.server);
    if(info.hasOwnProperty('realname')) user.setRealname(info.realname);
    if(info.hasOwnProperty('account')) user.setAccount(info.account);
    if(info.hasOwnProperty("idle")) user.setIdleTime(info.idle);
    
    if(info.hasOwnProperty('channels')) {
        var _chans = [];
        for(var j in info.channels) {
            var mode = info.channels[j].split("#")[0];
            if(mode !== "") {
                this.server.getChannel("#"+info.channels[j].split("#")[1]).addUserMode(info.nick, mode);
            }
            _chans.push("#"+info.channels[j].split("#")[1]);
        }
        user.setInChannels(_chans);
    }

    this.logger.info('Whois >> %s (finished in %sms)', user.getNick(), new Date().getTime() - user.whoisTime);
};
GLaDOS.prototype.irc_channelListItem = function(info) {
    if(info.name[0] !== "#") return;
    var channel = this.server.getChannel(info.name), pos = 0, modes;
    channel.setUserCount(info.users);

    for(; pos<info.topic.length; pos++) {
        if(info.topic[pos] == "]") break;
    }
    channel.setTopic({
        "nick": null,
        "topic": info.topic.slice(pos+2),
        "time": null
    });

    modes = info.topic.slice(2, pos);
    for(var i=0; i<modes.length; i++) {
        channel.setMode(modes[i]);
    }
};
GLaDOS.prototype.irc_error = function(message) {
    this.logger.info('CLIENT ERROR: %s: %s', message.command, message.args.join(' '));
};