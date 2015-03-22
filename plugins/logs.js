var _           = require('lodash');
var util        = require('util');
var fs          = require('fs');
var os          = require('os');
var mkdirp      = require('mkdirp');
var path        = require('path');
var rimraf      = require('rimraf');
var ircC        = require('irc-colors');
var Boom        = require('boom');
var handlebars  = require('handlebars');
var autolinker  = require('autolinker');

exports.register = function (glados, next) {
    var database = glados.brain('logs');
    var db = {
        isEnabled: function (channelName) {
            var enabled = database.object[channelName];
            if (_.isBoolean(enabled)) {
                return enabled;
            }
            database.object[channelName] = false;
            database.save();
            return false;
        },
        enable: function (channelName) {
            mkdirp.sync(path.join(__dirname, '..', 'brain', 'logs', channelName));
            database.object[channelName] = true;
            database.save();
        },
        disable: function (channelName) {
            database.object[channelName] = false;
            database.save();
        }
    };

    glados.hear(/^!startlogs$/i, function (match, event) {
        if (!event.channel.userHasMinMode(event.user, '@')) {
            return event.user.notice('Nur Channel-Operatoren können Logs aktivieren.');
        }
        db.enable(event.channel.getName());
        event.user.notice('Es werden nun Channellogs für diesen Channel aufgezeichnet.');
    });
    glados.hear(/^!stoplogs$/i, function (match, event) {
        if (!event.channel.userHasMinMode(event.user, '@')) {
            return event.user.notice('Nur Channel-Operatoren können Logs deaktivieren.');
        }
        db.disable(event.channel.getName());
        event.user.notice('Es werden nun keine Channellogs mehr für diesen Channel aufgezeichnet.');
    });
    glados.hear(/^!remlogs$/i, function (match, event) {
        if (!event.channel.userHasMinMode(event.user, '@')) {
            return event.user.notice('Nur Channel-Operatoren können Logs löschen.');
        }
        rimraf(path.join(__dirname, '..', 'brain', 'logs', event.channel.getName()), function () {
            event.user.notice('Alle Channellogs für %s wurden gelöscht.', event.channel.getName());
        });
    });

    //========
    var writeToLog = function (channelName, eventName, who, info) {
        if (!db.isEnabled(channelName)) {
            return;
        }
        var date = new Date();
        info = info || {};
        var fileName = util.format('%s/%s-%s-%s.log',
            path.join(__dirname, '..', 'brain', 'logs', channelName),
            date.getUTCFullYear(),
            date.getUTCMonth() + 1,
            date.getUTCDate());

        var data = {
            ts: date.getTime(),
            event: eventName,
            who: who,
            info: info
        };

        fs.appendFile(fileName, JSON.stringify(data) + os.EOL, {encoding: 'utf8'}, function (err) {
            if (err) {
                if (err.code === 'ENOENT') {
                    mkdirp(path.join(__dirname, '..', 'brain', 'logs', channelName), function () {
                        writeToLog(channelName, eventName, who, info);
                    });
                }
                else {
                    glados.debug(err);
                }
            }
        });
    };

    glados.on('join', function (event) {
        writeToLog(event.channel.getName(), 'join', event.user.getNick());
    });
    glados.on('invite', function (event) {
        writeToLog(event.channel.getName(), 'invite', event.user.getNick(), {
            target: event.target.getNick()
        });
    });
    glados.on('kick', function (event) {
        writeToLog(event.channel.getName(), 'kick', event.user.getNick(), {
            by: event.by.getNick(),
            reason: event.reason === event.by.getNick() ? null : ircC.stripColorsAndStyle(event.reason)
        });
    });
    glados.on('mode', function (event) {
        if (event.channel) {
            var by = typeof event.by === 'string' ? event.by : event.by.getNick();
            writeToLog(event.channel.getName(), 'mode', by, {
                argument: event.argument,
                adding: event.adding,
                mode: event.mode
            });
        }
    });
    glados.on('nick', function (event) {
        event.user.whois(function () {
            _.each(_.keys(event.user.getChannels()), function (chanName) {
                writeToLog(chanName, 'nick', event.oldNick, {
                    newNick: event.user.getNick()
                });
            });
        });
    });
    glados.on('notice', function (event) {
        if (event.to[0] === '#') {
            var from = typeof event.from === 'string' ? event.from : event.from.getNick();
            writeToLog(event.to, 'notice', from, {
                message: ircC.stripColorsAndStyle(event.message)
            });
        }
    });
    glados.on('sendnotice', function (event) {
        if (event.target[0] === '#') {
            writeToLog(event.target, 'notice', this.me.getNick(), {
                message: ircC.stripColorsAndStyle(event.message)
            });
        }
    });
    glados.on('part', function (event) {
        _.each(event.channels, function (channel) {
            writeToLog(channel.getName(), 'part', event.user.getNick(), {
                reason: ircC.stripColorsAndStyle(event.message)
            });
        });
    });
    glados.on('message', function (event) {
        writeToLog(event.channel.getName(), 'message', event.user.getNick(), {
            message: ircC.stripColorsAndStyle(event.message),
            isAction: event.isAction
        });
    });
    glados.on('sendmessage', function (event) {
        writeToLog(event.target, 'message', this.me.getNick(), {
            message: ircC.stripColorsAndStyle(event.message),
            isAction: false
        });
    });
    glados.on('quit', function (event) {
        _.each(_.keys(event.user.getChannels()), function (chanName) {
            writeToLog(chanName, 'quit', event.user.getNick(), {
                message: ircC.stripColorsAndStyle(event.message)
            });
        });
    });
    glados.on('topic', function (event) {
        if (event.changed) {
            var user = typeof event.user === 'string' ? event.user : event.user.getNick();
            writeToLog(event.channel.getName(), 'topic', user, {
                topic: ircC.stripColorsAndStyle(event.topic)
            });
        }
    });

    //========
    var getChannel = function (callback) {
        fs.readdir(path.join(__dirname, '..', 'brain', 'logs'), function (error, dirs) {
            if (!error) {
                dirs = _.map(dirs, function (dir) {
                    return dir.substr(1);
                });
                dirs = _.sortBy(dirs, function (dir) {
                    return dir;
                });
            }
            return callback(error, dirs);
        });
    };
    var getLogfiles = function (channel, callback) {
        fs.readdir(path.join(__dirname, '..', 'brain', 'logs', '#' + channel), function (error, files) {
            if (!error) {
                files = _.map(files, function (file) {
                    return file.slice(0, -4);
                });
                files = _.sortBy(files, function (file) {
                    return file;
                }).reverse();
            } else {
                files = [];
            }
            return callback(files);
        });
    };
    glados.web().route({
        path: '/logs',
        method: 'GET',
        handler: function (request, reply) {
            getChannel(function (error, channel) {
                if (error) {
                    return reply(Boom.badImplementation(error));
                }
                return reply.view('logs', {
                    mainnav: '/logs',
                    type: 'channelList',
                    channelList: channel
                });
            });
        }
    });
    glados.web().route({
        path: '/logs/{channel}',
        method: 'GET',
        handler: function (request, reply) {
            var channel =  encodeURIComponent(request.params.channel);
            getLogfiles(channel, function (files) {
                return reply.view('logs', {
                    mainnav: '/logs',
                    type: 'logList',
                    channel: channel,
                    files: files
                });
            });
        }
    });
    glados.web().route({
        path: '/logs/{channel}/latest',
        method: 'GET',
        handler: function (request, reply) {
            var channel =  encodeURIComponent(request.params.channel);
            return getLogfiles(channel, function (files) {
                return reply.redirect('/logs/' + channel + '/' + files[0]);
            });
        }
    });
    glados.web().route({
        path: '/logs/{channel}/{logFile}',
        method: 'GET',
        handler: function (request, reply) {
            var channel =  encodeURIComponent(request.params.channel);
            var logFile =  encodeURIComponent(request.params.logFile);
            var fileName = path.join(__dirname, '..', 'brain', 'logs', '#' + channel, logFile + '.log');
            fs.readFile(fileName, {encoding: 'utf8'}, function (error, contents) {
                if (error) {
                    return reply(Boom.notFound());
                }

                var data = null;
                data = '[';
                data += contents.split(os.EOL).join(',');
                data = data.slice(0, -1);
                data += ']';
                data = JSON.parse(data);

                data = _.map(data, function (d) {
                    d.date = new Date(d.ts);
                    if (d.event === 'message' || d.event === 'notice') {
                        d.info.message = handlebars.Utils.escapeExpression(d.info.message);
                        d.info.message = autolinker.link(d.info.message, {
                            stripPrefix: false,
                            twitter: false,
                        });
                    }
                    return d;
                });
                return reply.view('logs', {
                    mainnav: '/logs',
                    type: 'logFile',
                    channel: channel,
                    logFile: logFile,
                    data: data
                });
            });
        }
    });
    return next();
};
exports.info = {
    name: 'logs',
    displayName: 'Channel Logs',
    desc: ['Channel Logs'],
    version: '1.0.0',
    commands: [{
        name: 'startlogs',
        desc: [
            'Aktiviert das aufzeichnen von Channellogs für den aktuellen Channel.',
            'Kann nur von Channel-Operatoren genutzt werden.'
        ]
    },{
        name: 'stoplogs',
        desc: [
            'Deaktiviert das aufzeichnen von Channellogs für den aktuellen Channel.',
            'Kann nur von Channel-Operatoren genutzt werden.'
        ]
    },{
        name: 'remlogs',
        desc: [
            'Löscht alle bisherigen Channellogs für den aktuellen Channel.',
            'Kann nur von Channel-Operatoren genutzt werden.'
        ]
    }]
};