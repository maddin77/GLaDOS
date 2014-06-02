'use strict';
var utils = require(__dirname + '/../lib/utils');
var debug = require('debug')('GLaDOS:script:control');

module.exports = function (irc) {
    irc.command(['mem', 'memory'], function (event) {
        if (irc.config.admin.indexOf(event.user.getNick()) > -1) {
            var mem = process.memoryUsage();
            event.user.notice(utils.readableNumber(mem.rss) + " (v8: " + utils.readableNumber(mem.heapUsed) + " / " + utils.readableNumber(mem.heapTotal) + ")");
        } else {
            event.user.notice('You don\'t have the permissions to use this command.');
        }
    });
    irc.command('join', function (event) {
        if (irc.config.admin.indexOf(event.user.getNick()) > -1) {
            if (event.params.length > 0) {
                var channelName = event.params[0];
                irc.brain.sismember('autojoin', channelName, function (error, isMember) {
                    if (!error) {
                        if (isMember === 0) {
                            irc.brain.sadd('autojoin', channelName);
                            irc.join(channelName);
                        } else {
                            event.user.notice('I\'m already in this channel.');
                        }
                    } else {
                        debug('[join/ismember] %s', error);
                    }
                });
            } else {
                event.user.notice('Use: !join <#channel>');
            }
        } else {
            event.user.notice('You don\'t have the permissions to use this command.');
        }
    });
    irc.command('part', function (event) {
        if (irc.config.admin.indexOf(event.user.getNick()) > -1) {
            var channelName, msg;
            if (event.params.length > 0) {
                if (event.params[0][0] === '#') {
                    channelName = event.params[0];
                    msg = event.text.substr(channelName.length + 1);
                } else {
                    channelName = event.channel.getName();
                    msg = event.text;
                }
            } else {
                channelName = event.channel.getName();
                msg = null;
            }
            irc.brain.sismember('autojoin', channelName, function (error, isMember) {
                if (!error) {
                    if (isMember === 1) {
                        irc.brain.srem('autojoin', channelName);
                        irc.part(channelName, msg);
                    } else {
                        event.user.notice('I\'m not in this channel.');
                    }
                } else {
                    debug('[part/ismember] %s', error);
                }
            });
        } else {
            event.user.notice('You don\'t have the permissions to use this command.');
        }
    });
    irc.command('raw', function (event) {
        if (irc.config.admin.indexOf(event.user.getNick()) > -1) {
            irc.write(event.text);
        } else {
            event.user.notice('You don\'t have the permissions to use this command.');
        }
    });
    irc.command('exit', function (event) {
        if (irc.config.admin.indexOf(event.user.getNick()) > -1) {
            irc.quit(event.text);
        } else {
            event.user.notice('You don\'t have the permissions to use this command.');
        }
    });
    irc.command(['say', 'msg'], function (event) {
        if (irc.config.admin.indexOf(event.user.getNick()) > -1) {
            if (event.params.length > 0) {
                var parts = event.params;
                irc.send(parts.shift(), parts.join(' '));
            } else {
                event.user.notice('Use: !say <target> <message>');
            }
        } else {
            event.user.notice('You don\'t have the permissions to use this command.');
        }
    });
    irc.on('message', function (event) {
        if (irc.config.admin.indexOf(event.user.getNick()) > -1 && !event.isAction) {
            var params = event.message.split(' ');
            if (params[0] === 'RAW') {
                irc.write(event.message.substr(params[0] + 1));
            }
        }
    });
    irc.on('motd', function (event) {
        irc.config.irc.channel.forEach(function (channel) {
            irc.brain.sadd('autojoin', channel);
        });
        irc.brain.smembers('autojoin', function (error, channelNames) {
            if (!error) {
                irc.join(channelNames);
            } else {
                debug('[autojoin] %s', error);
            }
        });
    });
};