var EventEmitter = require('events').EventEmitter;
var events = new EventEmitter();
/*
 *
 */
var winston = require('winston');
var logger = new (winston.Logger)({
    transports: [
        new (winston.transports.Console)({colorize: true, timestamp: true})
    ]
});
exports.logger = logger;
/*
 *
 */
var fs = require('fs');
if(!fs.existsSync(DATA_DIR + 'config.json')) {
    fs.writeFileSync(DATA_DIR + 'config.json', fs.readFileSync(__dirname + '/../data/default.config.json'));
}

var nconf = require('nconf');
var config = nconf.file('', {
    json_spacing: 4, 
    file: DATA_DIR + 'config.json'
});
exports.config = config;
/*
 *
 */
var plugins = [];
/*
 *
 */
var IRC = require('irc');
var ircClient = new IRC.Client(config.get('irc:server'), config.get('irc:nick'), config.get('irc'));
/*
 *
 */
var Server = new require('./server');
var server = new Server(ircClient, config, logger);
/*
 *
 */
ircClient.addListener('registered', function(message) {
    logger.info(message.args.join(' '));
    events.emit('ircEvent.registered');
});
ircClient.addListener('motd', function(motd) {
    logger.info(motd);
    server.setMotd(motd);
    events.emit('ircEvent.motd', motd);
});
ircClient.addListener('names', function(chanName, nicks) {
    var channel = server.getChannel(chanName);
    var nickList = [];
    for (var nick in nicks) {
        if(nicks[nick] == "~" || nicks[nick] == "&" || nicks[nick] == "@" || nicks[nick] == "%" || nicks[nick] == "+") {
            channel.addUserMode(nick, nicks[nick]);
        }
        channel.addNick(nick);
        nickList.push(nicks[nick] + nick);
        //server.getUser(nick).whois();
    }
    logger.info('[%s] User : %s', channel.getName(), nickList.join(", "));
    events.emit('ircEvent.names', channel, nicks);
});
ircClient.addListener('topic', function(chanName, topic, nick, message) {
    var channel = server.getChannel(chanName);
    var date = new Date(message.args[3]*1000);
    channel.setTopic({
        "nick": nick,
        "topic": topic,
        "time": date
    });
    logger.info('[%s] Topic: %s', channel.getName(), topic);
    logger.info('[%s] Topic set by %s. (%s)', channel.getName(), nick, date.toString());
    events.emit('ircEvent.topic', channel, topic, nick, date);
});
ircClient.addListener('join', function(chanName, nick, message) {
    var user = server.getUser(nick);
    var channel = server.getChannel(chanName);
    logger.info('[%s] %s has joined.', channel.getName(), user.getNick());
    channel.addNick(nick);
    if(user.getNick() != ircClient.nick) {
        user.whois();
    }
    events.emit('ircEvent.join', channel, user);
});
ircClient.addListener('part', function(chanName, nick, reason, message) {
    reason = (reason||'').trim();
    var user = server.getUser(nick);
    var channel = server.getChannel(chanName);
    logger.info('[%s] %s has left (%s).', channel.getName(), user.getNick(), reason);
    channel.remNick(nick);
    events.emit('ircEvent.part', channel, user, reason);
});
ircClient.addListener('quit', function(nick, reason, channelsNames, message) {
    reason = (reason||'').trim();
    var user = server.getUser(nick);
    logger.info('%s has quit (%s)', user.getNick(), reason);
    user.setOffline();
    var channels = [];
    channelsNames.forEach(function(chanName) {
        var channel = server.getChannel(chanName);
        channel.remNick(nick);
        channels.push(channel);
    });
    events.emit('ircEvent.quit', user, channels, reason);
});
ircClient.addListener('kick', function(chanName, nick, nickBy, reason, message) {
    reason = (reason||'').trim();
    var user = server.getUser(nick);
    var by = server.getUser(nickBy);
    var channel = server.getChannel(chanName);

    logger.info('[%s] %s has kicked %s (%s).', channel.getName(), by.getNick(), user.getNick(), reason);
    channel.remNick(nick);
    events.emit('ircEvent.kick', channel, user, by, reason);
});
ircClient.addListener('kill', function(nick, reason, channelsNames, message) {
    reason = (reason||'').trim();
    var user = server.getUser(nick);
    logger.info('%s has been killed (%s)', user.getNick(), reason);
    user.setOffline();
    var channels = [];
    channelsNames.forEach(function(chanName) {
        var channel = server.getChannel(chanName);
        channel.remNick(nick);
        channels.push(channel);
    });
    events.emit('ircEvent.kill', user, channels, reason);
});
ircClient.addListener('pm', function(nick, text, message) {
    var user = server.getUser(nick);
    text = text.trim();
    logger.info('[PM] %s: %s', user.getNick(), text);
    user.whois(function() {
        if(text.toLowerCase().indexOf('help') === 0) {
            var parts = text.split(" ");
            if(parts.length == 1) {
                user.say("***** " + ircClient.nick + " Help *****");
                user.say("Hi! I am " + ircClient.nick + ". I react on defined commands or interactions in a Channel.");
                user.say(" ");
                user.say("For more information on a plugin, type:");
                user.say("/msg " + ircClient.nick + " HELP <plugin>");
                user.say(" ");
                user.say("The following plugins are available:");
                var pluginNames = [];
                plugins.forEach(function(plugin) {
                    pluginNames.push(plugin.name.toUpperCase());
                });
                user.say(pluginNames.join(", ") || "-");
                user.say("***** " + ircClient.nick + " Help *****");
            }
            else {
                var exist = false;
                plugins.forEach(function(plugin) {
                    if(plugin.name.toLowerCase() === parts[1].toLowerCase()) {
                        exist = true;
                        for(var category in plugin) {
                            user.say('\x1F' + category.toUpperCase());
                            var content = plugin[category];
                            if(!(content instanceof Array)) {
                                content = [content];
                            }
                            content.forEach(function(desc) {
                                user.say('    ' + desc);
                            });
                        }
                    }
                });
                if(!exist) {
                    user.say("No Help available for '" + parts[1] + "'.");
                }
            }
        }
        else {
            events.emit('ircEvent.pm', user, text);
        }
    });
});
ircClient.addListener('message#', function(nick, to, text, message) {
    var user = server.getUser(nick);
    var channel = server.getChannel(to);
    text = text.trim();
    logger.info('[%s] %s: %s', channel.getName(), user.getNick(), text);
    user.whois(function() {
        if(text.indexOf('!') === 0) {
            var cmdName = text.split(" ")[0].substr(1).toLowerCase();
            text = text.substr(cmdName.length+2);
            var params = text.length === 0 ? [] : text.split(" ");
            events.emit('cmd.'+cmdName, channel, user, cmdName, text, params);
        }
        else {
            events.emit('ircEvent.message', channel, user, text);
        }
    });
});
ircClient.addListener('notice', function(nick, to, text, message) {
    text = text.trim();
    if(typeof nick === 'undefined') {
        logger.info('[%s] %s', config.get('irc:server'), text);
    }
    else {
        var user = server.getUser(nick);
        logger.info('[W] %s: %s', user.getNick(), text);
        events.emit('ircEvent.notice', user, to, text);
    }
});
ircClient.addListener('action', function(nick, to, text) {
    text = text.trim();
    var user = server.getUser(nick);
    logger.info('[%s] * %s %s', to, user.getNick(), text);
    events.emit('ircEvent.action', user, to, text);
});
ircClient.addListener('ping', function(svr) {
    //logger.info('[%s] - Ping/Pong', server.getIp());
    server.lastping = new Date();
    events.emit('ircEvent.ping');
});
ircClient.addListener('ctcp', function(from, to, text, type) {
    if(text.substr(0, 6) == "ACTION") return; //filter ACTIONS
    logger.info('[CTCP] %s > %s: %s', from, to, text);
    events.emit('ircEvent.ctcp', from, to, text, type);
});
ircClient.addListener('ctcp-version', function(from, to) {
    ircClient.ctcp(from, "notice", "VERSION " + VERSION);
});
ircClient.addListener('nick', function(oldnick, newnick, channelsNames, message) {
    logger.info('%s is now known as %s.', oldnick, newnick);
    if(oldnick === config.get('irc:nick')) {
        config.set('irc:nick', newnick);
    }
    var user = server.getUser(oldnick);
    user.setNick(newnick);
    var channels = [];
    channelsNames.forEach(function(chanName) {
        var channel = server.getChannel(chanName);
        channel.remNick(oldnick);
        channel.addNick(newnick);
        channels.push(channel);
    });
    events.emit('ircEvent.nick', channels, user, oldnick, newnick);
});
ircClient.addListener('invite', function(chanName, from, message) {
    var channel = server.getChannel(chanName);
    var user = server.getUser(from);
    logger.info('%s invites you to join %s.', user.getNick(), channel.getName());
    events.emit('ircEvent.invite', channel, user);
});
ircClient.addListener('+mode', function(chanName, by, mode, argument, message) {
    var user = server.getUser(by);
    var channel = server.getChannel(chanName);
    if(typeof argument !== 'undefined') {
        channel.addUserMode(argument, mode);
        if(channel.userExistInChannel(argument)) {
            server.getUser(argument).whois();
        }
        logger.info('[%s] %s sets modes: %s%s %s', channel.getName(), user.getNick(), '+', mode, argument);
    }
    else {
        channel.setMode(mode);
        logger.info('[%s] %s sets modes: %s%s', channel.getName(), user.getNick(), '+', mode);
    }
    events.emit('ircEvent.mode', channel, user, true, mode, argument);
});
ircClient.addListener('-mode', function(chanName, by, mode, argument, message) {
    var user = server.getUser(by);
    var channel = server.getChannel(chanName);
    if(typeof argument !== 'undefined') {
        channel.remUserMode(argument, mode);
        if(channel.userExistInChannel(argument)) {
            server.getUser(argument).whois();
        }
        logger.info('[%s] %s sets modes: %s%s %s', channel.getName(), user.getNick(), '-', mode, argument);
    }
    else {
        channel.setMode(mode);
        logger.info('[%s] %s sets modes: %s%s', channel.getName(), user.getNick(), '-', mode);
    }
    events.emit('ircEvent.mode', channel, user, false, mode, argument);
});
ircClient.addListener('channellist_item', function(info) {
    if(info.name[0] !== "#") return;
    var channel = server.getChannel(info.name), pos = 0, modes;

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
});
ircClient.addListener('error', function(message) {
    logger.error('CLIENT ERROR: %s: %s', message.command, message.args.join(' '));
});

function register(info, callback) {
    logger.info('Plugin registered: ' + info.name);
    plugins.push(info);
    var ircEvent = function(names, cb) {
        if(!(names instanceof Array)) {
            names = [names];
        }
        names.forEach(function(name) {
            events.on('ircEvent.'+name, cb);
        });
    };
    var command = function(names, cb) {
        if(!(names instanceof Array)) {
            names = [names];
        }
        names.forEach(function(name) {
            events.on('cmd.'+name, cb);
        });
    };
    callback(ircEvent, command);
};
exports.register = register;

exports.getUser = function(nick) {
    return server.getUser(nick||config.get('irc:nick'));
};
exports.getChannel = function(name) {
    return server.getChannel(name);
};
exports.sendRaw = function(rawLine) {
    return ircClient.send(rawLine);
};
exports.sendMessage = function(target, message) {
    return ircClient.say(target, message);
};
function shutdown() {
    ircClient.disconnect('Pyah', function() {
        console.log('Bye!');
    });
}
exports.shutdown = shutdown;
