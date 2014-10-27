var utils   = require('./../lib/utils');
var _       = require('underscore');
var ircC    = require('irc-colors');

module.exports = function (scriptLoader) {
    scriptLoader.on('command', 'version', function (event) {
        var p = require('./../package.json');
        event.user.notice(p.name + ' - ' + p.version);
    });
    scriptLoader.on('command', ['sinfo', 'mem', 'memory'], function (event) {
        if (event.user.isAdmin()) {
            var mem = process.memoryUsage();
            event.user.say('    %s', ircC.bold.underline('System'));
            event.user.say('            %s: %s', ircC.bold('Plattform'), process.platform);
            event.user.say('            %s: %s', ircC.bold('Processor architecture'), process.arch);
            event.user.say('            %s: %s', ircC.bold('Uptime (Node)'), utils.formatTime(process.uptime()));
            event.user.say('   %s', ircC.bold.underline('Process'));
            event.user.say('            %s: %s', ircC.bold('PID'), process.pid);
            event.user.say('            %s: %s', ircC.bold('Group ID'), process.platform !== 'win32' ? process.getgid() : 'only available on POSIX platforms');
            event.user.say('            %s: %s', ircC.bold('User ID'), process.platform !== 'win32' ? process.getuid() : 'only available on POSIX platforms');
            event.user.say('            %s: %s (V8 Heap: %s Used / %s Total)', ircC.bold('Memory'), utils.readableNumber(mem.rss), utils.readableNumber(mem.heapUsed), utils.readableNumber(mem.heapTotal));
            event.user.say('  %s', ircC.bold.underline('Versions'));
            _.each(process.versions, function (version, name) {
                event.user.say('            %s: %s', ircC.bold(name), version);
            });
        } else {
            event.user.notice('You don\'t have the permissions to use this command.');
        }
    });
    scriptLoader.on('command', 'join', function (event) {
        if (event.user.isAdmin()) {
            if (event.params.length > 0) {
                var channelName = event.params[0];
                scriptLoader.connection.join(channelName);
                if (scriptLoader.connection.config.channels.indexOf(channelName) === -1) {
                    scriptLoader.connection.config.channels.push(channelName);
                    scriptLoader.connection.config.save();
                }
            } else {
                event.user.notice('Use: !join <#channel>');
            }
        } else {
            event.user.notice('You don\'t have the permissions to use this command.');
        }
    });
    scriptLoader.on('command', 'part', function (event) {
        if (event.user.isAdmin()) {
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
                msg = '';
            }
            scriptLoader.connection.part(channelName, msg);
            scriptLoader.connection.config.channels = _.without(scriptLoader.connection.config.channels, channelName);
            scriptLoader.connection.config.save();
        } else {
            event.user.notice('You don\'t have the permissions to use this command.');
        }
    });
    scriptLoader.on('command', ['cycle', 'rejoin'], function (event) {
        if (event.user.isAdmin()) {
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
                msg = '';
            }
            scriptLoader.connection.part(channelName, msg);
            scriptLoader.connection.join(channelName);
        }
    });
    scriptLoader.on('command', 'raw', function (event) {
        if (event.user.isAdmin()) {
            scriptLoader.connection.write(event.text);
        } else {
            event.user.notice('You don\'t have the permissions to use this command.');
        }
    });
    scriptLoader.on('command', 'exit', function (event) {
        if (event.user.isAdmin()) {
            scriptLoader.connection.quit(event.text);
            scriptLoader.connection.getConnectionManager().forEach(function (connection) {
                connection.disconnect();
            });
        } else {
            event.user.notice('You don\'t have the permissions to use this command.');
        }
    });
    scriptLoader.on('command', ['say', 'msg'], function (event) {
        if (event.user.isAdmin()) {
            if (event.params.length > 1) {
                var parts = event.params;
                scriptLoader.connection.send(parts.shift(), parts.join(' '));
            } else {
                event.user.notice('Use: !say <target> <message>');
            }
        } else {
            event.user.notice('You don\'t have the permissions to use this command.');
        }
    });

    scriptLoader.on('command', 'script', function (event) {
        if (event.user.isAdmin()) {
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
            } else if (event.params.length === 1 && event.params[0].toUpperCase() === 'LIST') {
                event.user.notice('Scripts loaded on %s: %s', scriptLoader.connection.getId(), scriptLoader.listScripts().join(', '));
            } else {
                event.user.notice('Use: !script <load/unload/reload/list> [scriptname]');
            }
        } else {
            event.user.notice('You don\'t have the permissions to use this command.');
        }
    });
    scriptLoader.on('command', 'admin', function (event) {
        if (event.user.isAdmin()) {
            if (event.params.length > 0) {
                if (event.params[0].toUpperCase() === 'ADD') {
                    if (event.params.length > 1) {
                        if (_.contains(scriptLoader.connection.config.admin, event.params[1])) {
                            event.user.notice(event.params[1] + ' is already admin.');
                        } else {
                            scriptLoader.connection.config.admin.push(event.params[1]);
                            scriptLoader.connection.config.save();
                            event.user.notice(event.params[1] + ' is now admin.');
                        }
                    } else {
                        event.user.notice('Use: !admin ADD <nick>');
                    }
                } else if (event.params[0].toUpperCase() === 'REM') {
                    if (event.params.length > 1) {
                        if (!_.contains(scriptLoader.connection.config.admin, event.params[1])) {
                            event.user.notice('There is no admin called "' + event.params[1] + '".');
                        } else {
                            scriptLoader.connection.config.admin = _.without(scriptLoader.connection.config.admin, event.params[1]);
                            scriptLoader.connection.config.save();
                            event.user.notice('Admin %s has been removed.', event.params[1]);
                        }
                    } else {
                        event.user.notice('Use: !admin REM <nick>');
                    }
                } else if (event.params[0].toUpperCase() === 'LIST') {
                    event.user.notice('The following nicks have admin privileges: ' + scriptLoader.connection.config.admin.join(', ') + '.');
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
    scriptLoader.on('privatemessage', function (event) {
        if (event.user.isAdmin()) {
            var params = event.message.split(' ');
            if (params[0] === 'RAW') {
                scriptLoader.connection.write(event.message.substr(params[0].length + 1));
            }
        }
    });
};