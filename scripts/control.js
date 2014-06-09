'use strict';
var utils = require(__dirname + '/../lib/utils');
var debug = require('debug')('GLaDOS:script:control');
var _ = require('underscore');

module.exports = function (scriptLoader, irc) {
    scriptLoader.registerCommand(['mem', 'memory'], function (event) {
        if (irc.config.admin.indexOf(event.user.getNick()) > -1) {
            var mem = process.memoryUsage();
            event.user.notice(utils.readableNumber(mem.rss) + " (v8: " + utils.readableNumber(mem.heapUsed) + " / " + utils.readableNumber(mem.heapTotal) + ")");
        } else {
            event.user.notice('You don\'t have the permissions to use this command.');
        }
    });
    scriptLoader.registerCommand('join', function (event) {
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
    scriptLoader.registerCommand('part', function (event) {
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
    scriptLoader.registerCommand('raw', function (event) {
        if (irc.config.admin.indexOf(event.user.getNick()) > -1) {
            irc.write(event.text);
        } else {
            event.user.notice('You don\'t have the permissions to use this command.');
        }
    });
    scriptLoader.registerCommand('exit', function (event) {
        if (irc.config.admin.indexOf(event.user.getNick()) > -1) {
            irc.quit(event.text);
        } else {
            event.user.notice('You don\'t have the permissions to use this command.');
        }
    });
    scriptLoader.registerCommand(['say', 'msg'], function (event) {
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

    scriptLoader.registerCommand('script', function (event) {
        if (irc.config.admin.indexOf(event.user.getNick()) > -1) {
            if (event.params.length > 1) {
                if (event.params[0].toUpperCase() === 'LOAD') {
                    scriptLoader.loadScript(event.params[1], function (err) {
                        event.user.notice(err ? err.message : 'Script "' + event.params[1].toLowerCase() + '" loaded.');
                    });
                } else if (event.params[0].toUpperCase() === 'UNLOAD') {
                    scriptLoader.unloadScript(event.params[1], function (err) {
                        event.user.notice(err ? err.message : 'Script "' + event.params[1].toLowerCase() + '" unloaded.');
                    });
                } else if (event.params[0].toUpperCase() === 'RELOAD') {
                    scriptLoader.reloadScript(event.params[1], function (err) {
                        event.user.notice(err ? err.message : 'Script "' + event.params[1].toLowerCase() + '" reloaded.');
                    });
                } else {
                    event.user.notice('Use: !script <load/unload/reload> <scriptname>');
                }
            } else {
                event.user.notice('Use: !script <load/unload/reload> <scriptname>');
            }
        } else {
            event.user.notice('You don\'t have the permissions to use this command.');
        }
    });

    scriptLoader.registerCommand('admin', function (event) {
        if (irc.config.admin.indexOf(event.user.getNick()) > -1) {
            if (event.params.length > 0) {
                if (event.params[0].toUpperCase() === 'ADD') {
                    if (event.params.length > 1) {
                        if (_.contains(irc.config.admin, event.params[1])) {
                            event.user.notice(event.params[1] + ' is already admin.');
                        } else {
                            irc.config.admin.push(event.params[1]);
                            irc.saveConfig();
                            event.user.notice(event.params[1] + ' is now admin.');
                        }
                    } else {
                        event.user.notice('Use: !admin ADD <nick>');
                    }
                } else if (event.params[0].toUpperCase() === 'REM') {
                    if (event.params.length > 1) {
                        if (!_.contains(irc.config.admin, event.params[1])) {
                            event.user.notice('There is no admin called "' + event.params[1] + '".');
                        } else {
                            irc.config.admin = _.without(irc.config.admin, event.params[1]);
                            irc.saveConfig();
                            event.user.notice('Admin ' + event.params[1] + ' has been removed.');
                        }
                    } else {
                        event.user.notice('Use: !admin REM <nick>');
                    }
                } else if (event.params[0].toUpperCase() === 'LIST') {
                    event.user.notice('The following nicks have admin privileges: ' + irc.config.admin.join(', ') + '.');
                } else {
                    event.user.notice('Use: !admin <add/rem/list> [nick]');
                }
            } else {
                event.user.notice('Use: !admin <add/rem/list> [nick]');
            }
        } else {
            event.user.notice('You don\'t have the permissions to use this command.');
        }
    });

    scriptLoader.registerEvent('message', function (event) {
        if (irc.config.admin.indexOf(event.user.getNick()) > -1 && !event.isAction) {
            var params = event.message.split(' ');
            if (params[0] === 'RAW') {
                irc.write(event.message.substr(params[0] + 1));
            }
        }
    });
};