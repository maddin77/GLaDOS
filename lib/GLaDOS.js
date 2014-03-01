'use strict';
var VERSION = require(__dirname + '/../package.json').version;
/*
 *
 */
var EventEmitter = require('events').EventEmitter;
var events = new EventEmitter();
/*
 *
 */
var nconf = require('nconf');
var config = nconf.file('', {
    json_spacing: 4,
    file: __dirname + '/../data/config.json'
});
exports.config = config;
/*
 *
 */
var winston = require('winston');
var CustomLogger = require('./customLogger');
var logger = new (winston.Logger)({
    transports: [
        new CustomLogger(config.get('logging'))
    ]
});
exports.logger = logger;

/*
 *
 */
var brain = require('./brain')(logger);
exports.brain = brain;
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
var Server = require('./server');
var server = new Server(ircClient, config, logger);
/*
 *
 */
var _ = require('underscore');
/*
 *
 */
ircClient.addListener('registered', function (message) {
    logger.info(message.args.join(' '), message);
    events.emit('ircEvent.registered');
});
ircClient.addListener('motd', function (motd) {
    logger.info(motd);
    server.setMotd(motd);
    events.emit('ircEvent.motd', motd);
    config.get('irc:channels').forEach(function (channel) {
        brain.hset('autojoin', channel, '');
    });
    brain.hgetall('autojoin', function (err, obj) {
        if (!err && obj) {
            Object.keys(obj).forEach(function (channel) {
                server.getChannel(channel).join();
                var chans = config.get('irc:channels');
                if (chans.indexOf(channel) === -1) {
                    chans.push(channel);
                    config.set('irc:channels', chans);
                    config.save();
                }
            });
        }
    });
});
ircClient.addListener('names', function (chanName, nicks) {
    var channel = server.getChannel(chanName),
        nickList = [];
    _.each(nicks, function (mode, nick, list) {
        if (mode === '~' || mode === '&' || mode === '@' || mode === '%' || mode === '+') {
            channel.addUserMode(nick, mode);
        }
        channel.addNick(nick);
        nickList.push(mode + nick);
    });
    logger.info('[%s] User : %s', channel.getName(), nickList.join(', '));
    events.emit('ircEvent.names', channel, nicks);
});
ircClient.addListener('topic', function (chanName, topic, nick, message) {
    var channel = server.getChannel(chanName),
        date = new Date(message.args[3] * 1000);
    channel.setTopic({
        'nick': nick,
        'topic': topic,
        'time': date
    });
    logger.info('[%s] Topic: %s', channel.getName(), topic, message);
    logger.info('[%s] Topic set by %s. (%s)', channel.getName(), nick, date.toString(), message);
    events.emit('ircEvent.topic', channel, topic, nick, date);
});
ircClient.addListener('join', function (chanName, nick, message) {
    var user = server.getUser(nick),
        channel = server.getChannel(chanName);
    logger.info('[%s] %s has joined.', channel.getName(), user.getNick(), message);
    channel.addNick(nick);
    if (user.getNick() !== ircClient.nick) {
        user.whois();
    }
    events.emit('ircEvent.join', channel, user);
});
ircClient.addListener('part', function (chanName, nick, reason, message) {
    reason = (reason || '').trim();
    var user = server.getUser(nick),
        channel = server.getChannel(chanName);
    logger.info('[%s] %s has left (%s).', channel.getName(), user.getNick(), reason, message);
    channel.remNick(nick);
    events.emit('ircEvent.part', channel, user, reason);
});
ircClient.addListener('quit', function (nick, reason, channelsNames, message) {
    reason = (reason || '').trim();
    var user = server.getUser(nick),
        channels = [];
    logger.info('%s has quit (%s)', user.getNick(), reason, message);
    user.setOffline();
    channelsNames.forEach(function (chanName) {
        var channel = server.getChannel(chanName);
        channel.remNick(nick);
        channels.push(channel);
    });
    events.emit('ircEvent.quit', user, channels, reason);
});
ircClient.addListener('kick', function (chanName, nick, nickBy, reason, message) {
    reason = (reason || '').trim();
    var user = server.getUser(nick),
        by = server.getUser(nickBy),
        channel = server.getChannel(chanName);

    logger.info('[%s] %s has kicked %s (%s).', channel.getName(), by.getNick(), user.getNick(), reason, message);
    channel.remNick(nick);
    events.emit('ircEvent.kick', channel, user, by, reason);
});
ircClient.addListener('kill', function (nick, reason, channelsNames, message) {
    reason = (reason || '').trim();
    var user = server.getUser(nick),
        channels = [];
    logger.info('%s has been killed (%s)', user.getNick(), reason, message);
    user.setOffline();
    channelsNames.forEach(function (chanName) {
        var channel = server.getChannel(chanName);
        channel.remNick(nick);
        channels.push(channel);
    });
    events.emit('ircEvent.kill', user, channels, reason);
});
ircClient.addListener('pm', function (nick, text, message) {
    var user = server.getUser(nick);
    text = text.trim();
    user.whois(function () {
        if (text.toLowerCase().indexOf('help') === 0) {
            var parts = text.split(' '),
                pluginNames = [],
                exist = false;
            if (parts.length === 1) {
                user.say('***** ' + ircClient.nick + ' Help *****');
                user.say('Hi! I am ' + ircClient.nick + '. I react on defined commands or interactions in a Channel.');
                user.say(' ');
                user.say('For more information on a plugin, type:');
                user.say('/msg " + ircClient.nick + " HELP <plugin>');
                user.say(' ');
                user.say('The following plugins are available:');
                plugins.forEach(function (plugin) {
                    if (!plugin.system) {
                        pluginNames.push(plugin.name.toUpperCase());
                    }
                });
                user.say(pluginNames.join(', ') || '-');
                user.say('***** ' + ircClient.nick + ' Help *****');
                logger.info('%s requested help overview.', user.getNick(), message);
            } else {
                plugins.forEach(function (plugin) {
                    if (plugin.name.toLowerCase() === parts[1].toLowerCase() && !plugin.system) {
                        exist = true;
                        _.each(plugin, function (content, category, list) {
                            user.say('\x1F' + category.toUpperCase());
                            if (!(content instanceof Array)) {
                                content = [content];
                            }
                            content.forEach(function (desc) {
                                user.say('    ' + desc);
                            });
                        });
                    }
                });
                if (!exist) {
                    user.say('No Help available for "' + parts[1] + '".');
                }
                logger.info('%s requested help overview for %s.', user.getNick(), parts[1], message);
            }
        } else {
            logger.info('[PM] %s: %s', user.getNick(), text, message);
            events.emit('ircEvent.pm', user, text);
        }
    });
});
ircClient.addListener('message#', function (nick, to, text, message) {
    var user = server.getUser(nick),
        channel = server.getChannel(to);
    text = text.trim();
    logger.info('[%s] %s: %s', channel.getName(), user.getNick(), text, message);
    user.whois(function () {
        if (text.indexOf('!') === 0) {
            var cmdName = text.split(' ')[0].substr(1).toLowerCase(), params;
            text = text.substr(cmdName.length + 2);
            params = text.length === 0 ? [] : text.split(' ');
            events.emit('cmd.' + cmdName, channel, user, cmdName, text, params);
        } else {
            events.emit('ircEvent.message', channel, user, text);
        }
    });
});
ircClient.addListener('notice', function (nick, to, text, message) {
    text = text.trim();
    if (nick === undefined) {
        logger.info('[%s] %s', server.getIp(), text, message);
    } else {
        var user = server.getUser(nick);
        logger.info('[W] %s: %s', user.getNick(), text, message);
        events.emit('ircEvent.notice', user, to, text);
    }
});
ircClient.addListener('action', function (nick, to, text) {
    text = text.trim();
    var user = server.getUser(nick);
    logger.info('[%s] * %s %s', to, user.getNick(), text);
    events.emit('ircEvent.action', user, to, text);
});
ircClient.addListener('ping', function () {//svr
    server.lastping = new Date();
    events.emit('ircEvent.ping');
});
ircClient.addListener('ctcp', function (from, to, text, type) {
    if (text.substr(0, 6) !== 'ACTION') {//filter ACTIONS
        logger.info('[CTCP] %s > %s: %s', from, to, text);
        events.emit('ircEvent.ctcp', from, to, text, type);
    }
});
ircClient.addListener('ctcp-version', function (from) {//to
    ircClient.ctcp(from, 'notice', 'VERSION ' + VERSION);
});
ircClient.addListener('nick', function (oldnick, newnick, channelsNames, message) {
    logger.info('%s is now known as %s.', oldnick, newnick, message);
    if (oldnick === ircClient.nick) {
        config.set('irc:nick', newnick);
    }
    var user = server.getUser(oldnick),
        channels = [];
    user.setNick(newnick);
    channelsNames.forEach(function (chanName) {
        var channel = server.getChannel(chanName);
        channel.remNick(oldnick);
        channel.addNick(newnick);
        channels.push(channel);
    });
    events.emit('ircEvent.nick', channels, user, oldnick, newnick);
});
ircClient.addListener('invite', function (chanName, from, message) {
    var channel = server.getChannel(chanName),
        user = server.getUser(from);
    logger.info('%s invites you to join %s.', user.getNick(), channel.getName(), message);
    events.emit('ircEvent.invite', channel, user);
});
ircClient.addListener('+mode', function (chanName, by, mode, argument, message) {
    var user = server.getUser(by),
        channel = server.getChannel(chanName);
    if (argument !== undefined) {
        channel.addUserMode(argument, mode);
        if (channel.userExistInChannel(argument)) {
            server.getUser(argument).whois();
        }
        logger.info('[%s] %s sets modes: %s%s %s', channel.getName(), user.getNick(), '+', mode, argument, message);
    } else {
        channel.setMode(mode);
        logger.info('[%s] %s sets modes: %s%s', channel.getName(), user.getNick(), '+', mode, message);
    }
    events.emit('ircEvent.mode', channel, user, true, mode, argument);
});
ircClient.addListener('-mode', function (chanName, by, mode, argument, message) {
    var user = server.getUser(by),
        channel = server.getChannel(chanName);
    if (argument !== undefined) {
        channel.remUserMode(argument, mode);
        if (channel.userExistInChannel(argument)) {
            server.getUser(argument).whois();
        }
        logger.info('[%s] %s sets modes: %s%s %s', channel.getName(), user.getNick(), '-', mode, argument, message);
    } else {
        channel.setMode(mode);
        logger.info('[%s] %s sets modes: %s%s', channel.getName(), user.getNick(), '-', mode, message);
    }
    events.emit('ircEvent.mode', channel, user, false, mode, argument);
});
ircClient.addListener('channellist_item', function (info) {
    if (info.name[0] === '#') {
        var channel = server.getChannel(info.name), pos, i, modes;
        for (pos = 0; pos < info.topic.length; pos += 1) {
            if (info.topic[pos] === ']') {
                break;
            }
        }
        channel.setTopic({
            'nick': null,
            'topic': info.topic.slice(pos + 2),
            'time': null
        });

        modes = info.topic.slice(2, pos);
        for (i = 0; i < modes.length; i += 1) {
            channel.setMode(modes[i]);
        }
    }
});
ircClient.addListener('error', function (message) {
    logger.error('[CLIENT] %s: %s', message.command, message.args.join(' '), message);
});
function register(info, callback) {
    logger.info('Plugin registered: %s', info.name, info);
    plugins.push(info);
    var ircEvent, command;
    ircEvent = function (names, cb) {
        if (!(names instanceof Array)) {
            names = [names];
        }
        names.forEach(function (name) {
            events.on('ircEvent.' + name, cb);
        });
    };
    command = function (names, cb) {
        if (!(names instanceof Array)) {
            names = [names];
        }
        names.forEach(function (name) {
            events.on('cmd.' + name, cb);
        });
    };
    callback(ircEvent, command);
}
exports.register = register;

exports.clrs = function (text) {
    var codes = {
        bold:           '\u0002',
        reset:          '\u000f',
        underline:      '\u001f',
        reverse:        '\u0016',

        white:          '\u000300',
        black:          '\u000301',
        dark_blue:      '\u000302',
        dark_green:     '\u000303',
        light_red:      '\u000304',
        dark_red:       '\u000305',
        magenta:        '\u000306',
        orange:         '\u000307',
        yellow:         '\u000308',
        light_green:    '\u000309',
        cyan:           '\u000310',
        light_cyan:     '\u000311',
        light_blue:     '\u000312',
        light_magenta:  '\u000313',
        gray:           '\u000314',
        light_gray:     '\u000315'
    };

    text = text.replace(/\{B\}/g, codes.bold);
    text = text.replace(/\{R\}/g, codes.reset);
    text = text.replace(/\{U\}/g, codes.underline);
    text = text.replace(/\{REV\}/g, codes.reverse);
    text = text.replace(/\{FF\}/g, codes.whies);
    text = text.replace(/\{00\}/g, codes.black);
    text = text.replace(/\{DB\}/g, codes.dark_blue);
    text = text.replace(/\{DG\}/g, codes.dark_green);
    text = text.replace(/\{LR\}/g, codes.light_red);
    text = text.replace(/\{DR\}/g, codes.dark_red);
    text = text.replace(/\{M\}/g, codes.magenta);
    text = text.replace(/\{O\}/g, codes.orange);
    text = text.replace(/\{Y\}/g, codes.yellow);
    text = text.replace(/\{LG\}/g, codes.light_green);
    text = text.replace(/\{C\}/g, codes.cyan);
    text = text.replace(/\{LC\}/g, codes.light_cyan);
    text = text.replace(/\{LB\}/g, codes.light_blue);
    text = text.replace(/\{LM\}/g, codes.light_magenta);
    text = text.replace(/\{G\}/g, codes.gray);
    text = text.replace(/\{LG\}/g, codes.light_gray);
    return text;
};

exports.getUser = function (nick) {
    return server.getUser(nick || ircClient.nick);
};
exports.getChannel = function (name) {
    return server.getChannel(name);
};
exports.sendRaw = function (rawLine) {
    return ircClient.send(rawLine);
};
exports.sendMessage = function (target, message) {
    return ircClient.say(target, message);
};
function shutdown(msg) {
    ircClient.disconnect(msg || 'Pyah', function () {
        brain.quit();
        brain.on('end', function () {
            logger.info('Bye!');
        });
    });
}
exports.shutdown = shutdown;