'use strict';

var net = require('net');
var tls = require('tls');
var debug = require('debug')('glados:irc');
var Message = require("irc-message");
var replies = require('irc-replies');
var EventEmitter = require('events').EventEmitter;
var util = require('util');
var _ = require('underscore');
var Channel = require(__dirname + '/channel');
var User = require(__dirname + '/user');

var Client = module.exports = function (config) {
    this.config = config;
    this.channelCache = [];
    this.userCache = [];
    this.commands = new EventEmitter();
    this.whoisMap = {};
    this.channelList = [];

    var self = this;
    debug('Use SSL: %s', this.config.irc.ssl);
    if (this.config.irc.ssl !== false) {
        this.stream = tls.connect(config.irc.port, config.irc.host, {rejectUnauthorized: false}, function () {
            self.stream.connected = true;
            if (self.stream.authorized || self.stream.authorizationError === 'DEPTH_ZERO_SELF_SIGNED_CERT' || self.stream.authorizationError === 'CERT_HAS_EXPIRED' || self.stream.authorizationError === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE') {
                self.stream.setEncoding('utf-8');
                if (self.stream.authorizationError === 'CERT_HAS_EXPIRED') {
                    util.log('Connecting to server with expired certificate');
                }
                self.stream.emit('connect');
            } else {
                debug('[SSL-Error]' + self.stream.authorizationError);
            }
        });
    } else {
        this.stream = net.connect(config.irc.port, config.irc.host);
    }
    this.stream.requestedDisconnect = false;
    this.stream.setTimeout(0);
    this.stream.setEncoding('utf8');

    this.stream.addListener("connect", function () {
        debug('Socket connected');
        self.nick(config.irc.nick);
        self.write('PASS ' + config.irc.pass);
        self.write('USER ' + config.irc.user[0] + ' 0 * :' + config.irc.user[1]);
    });
    this.stream.addListener("data", function (chunk) {
        var lines = chunk.split('\r\n');
        lines = lines.filter(function (line) {
            return line !== '';
        });
        lines.forEach(function (msg) {

            self.handleMessage(msg.trim());
        });
    });
    this.stream.addListener("end", function () {
        debug('Socket end');
    });
    this.stream.addListener("close", function () {
        debug('Socket close');
    });
    this.stream.addListener("error", function (exception) {
        debug('Socket error: %s', exception);
    });
};

util.inherits(Client, EventEmitter);

Client.prototype.command = function (names, fn) {
    if (!(names instanceof Array)) {
        names = [names];
    }
    var self = this;
    names.forEach(function (name) {
        debug('Command registered: %s', name);
        self.commands.on(name, fn);
    });
};

Client.prototype.write = function (str, fn) {
    this.stream.write(str + '\r\n', fn);
    debug('>> %s', str);
};

Client.prototype.quit = function (str, fn) {
    this.write('QUIT ' + (str || ''));
    this.stream.once("end", fn);
    this.stream.end();
};

Client.prototype.nick = function (nick) {
    this.write('NICK ' + nick);
};

Client.prototype.join = function (channels) {
    channels = (Array.isArray(channels) ? channels : [channels]).join(',');
    this.write('JOIN ' + channels);
};

Client.prototype.kick = function (channels, nicks, msg) {
    channels = (Array.isArray(channels) ? channels : [channels]).join(',');
    nicks = (Array.isArray(nicks) ? nicks : [nicks]).join(',');
    this.write('KICK ' + channels + ' ' + nicks + ' :' + msg);
};
Client.prototype.send = function (target, msg) {
    var leading, maxlen, self;
    self = this;
    leading = 'PRIVMSG ' + target + ' :';
    maxlen = 512
            - (1 + this.config.irc.nick.length + 1 + this.config.irc.user[0].length + 1 + this.config.irc.host.length + 1)
            - leading.length
            - 2;
    /*jslint regexp: true*/
    msg.match(new RegExp('.{1,' + maxlen + '}', 'g')).forEach(function (str) {
        if (str[0] === ' ') { //leading whitespace
            str = str.substring(1);
        }
        if (str[str.length - 1] === ' ') { //trailing whitespace
            str = str.substring(0, str.length - 1);
        }
        self.write(leading + str);
    });
    /*jslint regexp: false*/
};

Client.prototype.notice = function (target, msg) {
    this.write('NOTICE ' + target + ' :' + msg);
};

Client.prototype.mode = function (target, flags, params) {
    if (params) {
        this.write('MODE ' + target + ' ' + flags + ' ' + params);
    } else {
        this.write('MODE ' + target + ' ' + flags);
    }
};

Client.prototype.part = function (channels, msg) {
    channels = (Array.isArray(channels) ? channels : [channels]).join(',');
    msg = msg || '';
    this.write('PART ' + channels + ' :' + msg);
};

Client.prototype.invite = function (name, channel) {
    this.write('INVITE ' + name + ' ' + channel);
};

Client.prototype.whois = function (nick, fn) {
    if (fn) {
        var self = this;
        this.whoisMap[nick] = this.whoisMap[nick] || {};
        this.whoisMap[nick].fn = function (data) {
            delete self.whoisMap[nick].fn;
            fn(data);
        };
    }
    this.write('WHOIS ' + nick);
};

Client.prototype._getChannel = function (channelName) {
    var channel = _.find(this.channelCache, function (chan) {
        return chan.getName() === channelName;
    });
    if (channel === undefined) {
        channel = new Channel(channelName, this);
        this.channelCache.push(channel);
    }
    return channel;
};

Client.prototype._getUser = function (nick) {
    var user = _.find(this.userCache, function (usr) {
        return usr.getNick() === nick;
    });
    if (user === undefined) {
        user = new User(nick, this);
        this.userCache.push(user);
    }
    return user;
};

Client.prototype._removeUser = function (nick) {
    nick = typeof nick === "string" ? nick : nick.getNick();
    this.userCache = _.filter(this.userCache, function (user) {
        return user.getNick() !== nick;
    });
};

Client.prototype._prefixToNick = function (prefix) {
    return prefix.split('!')[0];
};

Client.prototype._isPrefixNick = function (prefix) {
    return prefix.indexOf('!') > -1;
};

Client.prototype._getDisplayMode = function (mode) {
    switch (mode) {
    case 'Y':
        return '!';
    case 'q':
        return '~';
    case 'a':
        return '&';
    case 'o':
        return '@';
    case 'h':
        return '%';
    case 'v':
        return '+';
    }
};

Client.prototype.colorize = function (msg) {
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

    msg = msg.replace(/\{B\}/g, codes.bold);
    msg = msg.replace(/\{R\}/g, codes.reset);
    msg = msg.replace(/\{U\}/g, codes.underline);
    msg = msg.replace(/\{REV\}/g, codes.reverse);
    msg = msg.replace(/\{FF\}/g, codes.whies);
    msg = msg.replace(/\{00\}/g, codes.black);
    msg = msg.replace(/\{DB\}/g, codes.dark_blue);
    msg = msg.replace(/\{DG\}/g, codes.dark_green);
    msg = msg.replace(/\{LR\}/g, codes.light_red);
    msg = msg.replace(/\{DR\}/g, codes.dark_red);
    msg = msg.replace(/\{M\}/g, codes.magenta);
    msg = msg.replace(/\{O\}/g, codes.orange);
    msg = msg.replace(/\{Y\}/g, codes.yellow);
    msg = msg.replace(/\{LG\}/g, codes.light_green);
    msg = msg.replace(/\{C\}/g, codes.cyan);
    msg = msg.replace(/\{LC\}/g, codes.light_cyan);
    msg = msg.replace(/\{LB\}/g, codes.light_blue);
    msg = msg.replace(/\{LM\}/g, codes.light_magenta);
    msg = msg.replace(/\{G\}/g, codes.gray);
    msg = msg.replace(/\{LG\}/g, codes.light_gray);
    return msg;
};
Client.prototype.clrs = Client.prototype.colorize;

Client.prototype.handleMessage = function (message) {
    var parsed, channel, channelName, modeList, modeArgs, isAction, adding, by, user, oldNick, self = this, commandName, text, nick, fn, found, argument;

    parsed = new Message(message);
    parsed.command = replies[parsed.command] || parsed.command;

    debug('<< %s', parsed);

    this.emit('raw', {
        "parsed": parsed
    });

    switch (parsed.command) {
    case 'RPL_WELCOME':
        this.emit('welcome', {
            "parsed": parsed
        });
        break;
    case 'PING':
        this.write('PONG :' + parsed.params[0]);
        this.emit('ping', {
            "parsed": parsed
        });
        break;
    case 'NOTICE':
        this.emit('notice', {
            "from": this._isPrefixNick(parsed.prefix) ? this._getUser(this._prefixToNick(parsed.prefix)) : parsed.prefix,
            "to": parsed.params[0],
            "message": parsed.params[1],
            "parsed": parsed
        });
        break;
    case 'MODE':
        modeList = parsed.params[1].split('');
        modeArgs = parsed.params.slice(2);
        adding = true;
        by = this._isPrefixNick(parsed.prefix) ? this._getUser(this._prefixToNick(parsed.prefix)) : parsed.prefix;
        channel = (parsed.params[0][0] === '#' || parsed.params[0][0] === '&') ? this._getChannel(parsed.params[0]) : null;
        modeList.forEach(function (mode) {
            if (mode === '+') {
                adding = true;
                return;
            }
            if (mode === '-') {
                adding = false;
                return;
            }
            if (_.indexOf(['Y', 'q', 'a', 'o', 'h', 'v'], mode) !== -1) {
                argument = modeArgs.shift();
                if (channel) {
                    if (adding) {
                        channel.names[argument] = self._getDisplayMode(mode);
                    } else {
                        channel.names[argument] = '';
                    }
                }
                self.emit('mode', {
                    "channel": channel,
                    "by": by,
                    "argument": argument,
                    "adding": adding,
                    "mode": mode
                });
            } else {
                var modeArg;
                if (mode.match(/^[bkl]$/)) {
                    modeArg = modeArgs.shift();
                    if (modeArg.length === 0) {
                        modeArg = undefined;
                    }
                }
                self.emit('mode', {
                    "channel": channel,
                    "by": by,
                    "argument": modeArg,
                    "adding": adding,
                    "mode": mode
                });
            }
        });
        break;
    case 'NICK':
        user = this._getUser(this._prefixToNick(parsed.prefix));
        oldNick = user.getNick();
        user.nick = parsed.params[0];
        this.emit('nick', {
            "user": user,
            "oldNick": oldNick
        });
        if (oldNick === this.config.irc.nick) {
            this.config.irc.nick = user.getNick();
        }
        break;
    case 'RPL_MOTDSTART':
        this.motd = [parsed.params[1]];
        break;
    case 'RPL_MOTD':
        this.motd.push(parsed.params[1]);
        break;
    case 'ERR_NOMOTD':
    case 'RPL_ENDOFMOTD':
        this.motd.push(parsed.params[1]);
        this.emit('motd', {
            "motd": this.motd,
            "parsed": parsed
        });
        delete this.motd;
        break;
    case 'RPL_NAMREPLY':
        channelName = parsed.params[2].toLowerCase();
        this.nameReply = this.nameReply || {};
        this.nameReply[channelName] = this.nameReply[channelName] || {};
        parsed.params[3].split(' ').forEach(function (name) {
            if (name[0] === '!' || name[0] === '~' || name[0] === '&' || name[0] === '@' || name[0] === '%' || name[0] === '+') {
                self.nameReply[channelName][name.substr(1)] = name[0];
            } else {
                self.nameReply[channelName][name] = '';
            }
        });
        break;
    case 'RPL_ENDOFNAMES':
        channelName = parsed.params[1].toLowerCase();
        channel = this._getChannel(channelName);
        this.emit('names', {
            "channel": channel,
            "names": this.nameReply[channelName],
            "parsed": parsed
        });
        channel.names = this.nameReply[channelName];
        delete this.nameReply[channelName];
        break;
    case 'RPL_TOPIC':
        this._getChannel(parsed.params[1]).topic.topic = parsed.params[2];
        break;
    case 'RPL_TOPIC_WHO_TIME':
        channel = this._getChannel(parsed.params[1]);
        channel.topic.user = this._getUser(this._prefixToNick(parsed.params[2]));
        channel.topic.time = new Date(parseInt(parsed.params[3], 10) * 1000);
        this.emit('topic', {
            "channel": channel,
            "topic": channel.topic.topic,
            "user": channel.topic.user,
            "time": channel.topic.time,
            "topicChanged": false,
            "parsed": parsed
        });
        break;
    case 'TOPIC':
        channel = this._getChannel(parsed.params[0]);
        channel.topic.topic = parsed.params[1];
        channel.topic.user = this._getUser(this._prefixToNick(parsed.prefix));
        channel.topic.time = new Date();
        this.emit('topic', {
            "channel": channel,
            "topic": channel.topic.topic,
            "user": channel.topic.user,
            "time": channel.topic.time,
            "topicChanged": true
        });
        break;
    case 'JOIN':
        user = this._getUser(this._prefixToNick(parsed.prefix));
        channel = this._getChannel(parsed.params[0]);

        //add channel to list if i joined
        if (user.getNick() === this.config.irc.nick) {
            this.channelList.push(channel.getName());
            this.channelList = _.uniq(this.channelList);
        }

        //add user to channellist
        channel.names[user.getNick()] = '';

        //emit event
        this.emit('join', {
            "channel": channel,
            "user": user,
            "parsed": parsed
        });
        break;
    case 'PART':
        user = this._getUser(this._prefixToNick(parsed.prefix));
        channel = this._getChannel(parsed.params[0]);

        //remove channel from list if i parted
        if (user.getNick() === this.config.irc.nick) {
            this.channelList = _.without(this.channelList, channel.getName());
        }

        //remove user from channellist
        delete channel.names[user.getNick()];

        //check if we know the user from another channel. if not, kill him.
        found = false;
        this.channelList.forEach(function (channelName) {
            _.each(self._getChannel(channelName).getNames(), function (mode, nick, list) {
                if (user.getNick() === nick) {
                    found = true;
                }
            });
        });
        if (!found) {
            this._removeUser(user);
        }

        //emit event
        this.emit('part', {
            "channel": channel,
            "user": user,
            "parsed": parsed
        });
        break;
    case 'KICK':
        user = this._getUser(parsed.params[1]);
        channel = this._getChannel(parsed.params[0]);

        //remove channel from list if i parted
        if (user.getNick() === this.config.irc.nick) {
            this.channelList = _.without(this.channelList, channel.getName());
        }

        //remove user from channellist
        delete channel.names[user.getNick()];

        //check if we know the user from another channel. if not, kill him.
        found = false;
        this.channelList.forEach(function (channelName) {
            _.each(self._getChannel(channelName).getNames(), function (mode, nick, list) {
                if (user.getNick() === nick) {
                    found = true;
                }
            });
        });
        if (!found) {
            this._removeUser(user);
        }

        //emit event
        this.emit('kick', {
            "channel": channel,
            "user": user,
            "by": this._getUser(this._prefixToNick(parsed.prefix)),
            "reason": parsed.params[2],
            "parsed": parsed
        });
        break;
    case 'QUIT':
        user = this._getUser(this._prefixToNick(parsed.prefix));
        this.emit('quit', {
            "user": _.clone(user),
            "reason": parsed.params[0],
            "parsed": parsed
        });
        this._removeUser(user);
        break;
    case 'PRIVMSG':
        if (parsed.params[0] === this.config.irc.nick) {
            isAction = false;
            if (parsed.params[1][0] === '\u0001' && parsed.params[1].lastIndexOf('\u0001') > 0) {
                isAction = true;
                parsed.params[1] = parsed.params[1].slice(8, -1);
            }
            this.emit('privmsg', {
                "user": this._getUser(this._prefixToNick(parsed.prefix)),
                "message": parsed.params[1],
                "isAction": isAction,
                "parsed": parsed
            });
        } else {
            isAction = false;
            if (parsed.params[1][0] === '\u0001' && parsed.params[1].lastIndexOf('\u0001') > 0) {
                isAction = true;
                parsed.params[1] = parsed.params[1].slice(8, -1);
            }
            if (parsed.params[1][0] === '!' && !isAction) {
                commandName = parsed.params[1].split(' ')[0].substr(1).toLowerCase();
                text = parsed.params[1].substr(commandName.length + 2);
                this.commands.emit(commandName, {
                    "channel": this._getChannel(parsed.params[0]),
                    "user": this._getUser(this._prefixToNick(parsed.prefix)),
                    "message": parsed.params[1],
                    "name": commandName,
                    "text": text,
                    "params": text.length === 0 ? [] : text.split(' '),
                    "parsed": parsed
                });
                this.emit('command', {
                    "channel": this._getChannel(parsed.params[0]),
                    "user": this._getUser(this._prefixToNick(parsed.prefix)),
                    "message": parsed.params[1],
                    "name": commandName,
                    "text": text,
                    "params": text.length === 0 ? [] : text.split(' '),
                    "parsed": parsed
                });
            } else {
                this.emit('chanmsg', {
                    "channel": this._getChannel(parsed.params[0]),
                    "user": this._getUser(this._prefixToNick(parsed.prefix)),
                    "message": parsed.params[1],
                    "isAction": isAction,
                    "parsed": parsed
                });
            }
        }
        break;
    case 'INVITE':
        this.emit('invite', {
            "channel": this._getChannel(parsed.params[1]),
            "user": this._getUser(this._prefixToNick(parsed.prefix)),
            "parsed": parsed
        });
        break;
    case 'RPL_WHOISUSER':
        nick = parsed.params[1];
        this.whoisMap[nick] = this.whoisMap[nick] || {};
        this.whoisMap[nick].nick = nick;
        user = this._getUser(nick);
        user.username = parsed.params[2];
        this.whoisMap[nick].username = parsed.params[2];
        user.hostname = parsed.params[3];
        this.whoisMap[nick].hostname = parsed.params[3];
        user.realname = parsed.params[5];
        this.whoisMap[nick].realname = parsed.params[5];
        break;
    case 'RPL_WHOISCHANNELS':
        nick = parsed.params[1];
        user = this._getUser(nick);
        this.whoisMap[nick] = this.whoisMap[nick] || {};
        this.whoisMap[nick].channel = {};
        parsed.params[2].split(' ').forEach(function (channel) {
            if (channel[0] === '!' || channel[0] === '~' || channel[0] === '&' || channel[0] === '@' || channel[0] === '%' || channel[0] === '+') {
                self.whoisMap[nick].channel[channel.substr(1)] = channel[0];
            } else {
                self.whoisMap[nick].channel[channel] = '';
            }
        });
        user.channel = self.whoisMap[nick].channel;
        break;
    case 'RPL_WHOISSERVER':
        nick = parsed.params[1];
        user = this._getUser(nick);
        this.whoisMap[nick] = this.whoisMap[nick] || {};
        user.server = parsed.params[2];
        this.whoisMap[nick].server = parsed.params[2];
        user.serverInfo = parsed.params[3];
        this.whoisMap[nick].serverInfo = parsed.params[3];
        break;
    case 'RPL_AWAY':
        nick = parsed.params[1];
        user = this._getUser(nick);
        user.away = parsed.params[2];

        if (this.whoisMap[nick]) {
            this.whoisMap[nick].away = parsed.params[2];
        }
        break;
    case '330':
        nick = parsed.params[1];
        user = this._getUser(nick);
        this.whoisMap[nick] = this.whoisMap[nick] || {};
        if (parsed.params[3] === 'is logged in as') {
            user.account = parsed.params[2];
            this.whoisMap[nick].account = parsed.params[2];
        }
        break;
    case '307':
        nick = parsed.params[1];
        user = this._getUser(nick);
        this.whoisMap[nick] = this.whoisMap[nick] || {};
        if (parsed.params[2] === 'is a registered nick') {
            user.registered = true;
            this.whoisMap[nick].registered = true;
        }
        break;
    case '671':
        nick = parsed.params[1];
        user = this._getUser(nick);
        this.whoisMap[nick] = this.whoisMap[nick] || {};
        if (parsed.params[2] === 'is using a secure connection') {
            user.secure = true;
            this.whoisMap[nick].secure = true;
        }
        break;
    case 'RPL_WHOISIDLE':
        nick = parsed.params[1];
        user = this._getUser(nick);
        this.whoisMap[nick] = this.whoisMap[nick] || {};
        user.idle = parseInt(parsed.params[2], 10);
        this.whoisMap[nick].idle = parseInt(parsed.params[2], 10);
        user.signon = new Date(parseInt(parsed.params[3], 10) * 1000);
        this.whoisMap[nick].signon = new Date(parseInt(parsed.params[3], 10) * 1000);
        break;
    case 'RPL_WHOISOPERATOR':
        nick = parsed.params[1];
        user = this._getUser(nick);
        this.whoisMap[nick].admin = true;
        break;
    case 'RPL_ENDOFWHOIS':
        nick = parsed.params[1];
        this.whoisMap[nick] = this.whoisMap[nick] || {};
        fn = this.whoisMap[nick].fn;
        if (fn) {
            fn(this.whoisMap[nick]);
        } else {
            this.emit('whois', {
                "data": this.whoisMap[nick],
                "parsed": parsed
            });
        }
        break;
    case '396':
        this.config.irc.host = parsed.params[1];
        break;
    default:
        this.emit('unknown', {
            "parsed": parsed
        });
        break;
    }
};