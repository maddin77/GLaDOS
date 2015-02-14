'use strict';
module.exports = function (scriptLoader, glados) {
    scriptLoader.registerCommand(['k', 'kick'], function (connection, event) {
        if (event.channel.userHasMode(event.user, '!') || event.channel.userHasMode(event.user, '~') ||
                event.channel.userHasMode(event.user, '&') || event.channel.userHasMode(event.user, '@') || event.channel.userHasMode(event.user, '%')) {
            if (event.channel.userHasMode(connection.me, '!') || event.channel.userHasMode(connection.me, '~') ||
                    event.channel.userHasMode(connection.me, '&') || event.channel.userHasMode(connection.me, '@') || event.channel.userHasMode(connection.me, '%')) {
                if (event.params.length > 0) {
                    var nick = event.params[0],
                        reason = event.params.length > 1 ? event.text.substr(nick.length + 1) : '-';
                    if (event.channel.isUserInChannel(nick)) {
                        event.channel.kick(nick, '(' + event.user.getNick() + ') ' + reason);
                    } else {
                        event.user.notice('Sorry, i can\'t find ' + nick + ' in ' + event.channel.getName());
                    }
                } else {
                    event.user.notice('Use: !kick <nick> [reason]');
                }
            } else {
                event.user.notice('I don\'t have the permissions to kick someone in this channel.');
            }
        } else {
            event.user.notice('You don\'t have the permissions to use this command.');
        }
    });
    scriptLoader.registerCommand(['b', 'ban'], function (connection, event) {
        if (event.channel.userHasMode(event.user, '!') || event.channel.userHasMode(event.user, '~') ||
                event.channel.userHasMode(event.user, '&') || event.channel.userHasMode(event.user, '@') || event.channel.userHasMode(event.user, '%')) {
            if (event.channel.userHasMode(connection.me, '!') || event.channel.userHasMode(connection.me, '~') ||
                    event.channel.userHasMode(connection.me, '&') || event.channel.userHasMode(connection.me, '@') || event.channel.userHasMode(connection.me, '%')) {
                if (event.params.length > 0) {
                    var mask = event.params[0], user;
                    if (mask.indexOf('!') === -1 && mask.indexOf('@') === -1) {
                        if (event.channel.isUserInChannel(mask)) {
                            user = connection.getUser(mask);
                            user.whois(function (data) {
                                event.channel.ban(data.nick + '!' + data.username + '@' + data.hostname);
                            });
                        } else {
                            event.user.notice('Sorry, i can\'t find ' + mask + ' in ' + event.channel.getName());
                        }
                    } else {
                        event.channel.ban(mask);
                    }
                } else {
                    event.user.notice('Use: !ban <nick or hostmask>');
                }
            } else {
                event.user.notice('I don\'t have the permissions to ban someone in this channel.');
            }
        } else {
            event.user.notice('You don\'t have the permissions to use this command.');
        }
    });
    scriptLoader.registerCommand(['ub', 'unban'], function (connection, event) {
        if (event.channel.userHasMode(event.user, '!') || event.channel.userHasMode(event.user, '~') ||
                event.channel.userHasMode(event.user, '&') || event.channel.userHasMode(event.user, '@') || event.channel.userHasMode(event.user, '%')) {
            if (event.channel.userHasMode(connection.me, '!') || event.channel.userHasMode(connection.me, '~') ||
                    event.channel.userHasMode(connection.me, '&') || event.channel.userHasMode(connection.me, '@') || event.channel.userHasMode(connection.me, '%')) {
                if (event.params.length > 0) {
                    event.channel.unban(event.text);
                } else {
                    event.user.notice('Use: !unban <hostmask>');
                }
            } else {
                event.user.notice('I don\'t have the permissions to unban someone in this channel.');
            }
        } else {
            event.user.notice('You don\'t have the permissions to use this command.');
        }
    });
    scriptLoader.registerCommand(['kb', 'kickban'], function (connection, event) {
        if (event.channel.userHasMode(event.user, '!') || event.channel.userHasMode(event.user, '~') ||
                event.channel.userHasMode(event.user, '&') || event.channel.userHasMode(event.user, '@') || event.channel.userHasMode(event.user, '%')) {
            if (event.channel.userHasMode(connection.me, '!') || event.channel.userHasMode(connection.me, '~') ||
                    event.channel.userHasMode(connection.me, '&') || event.channel.userHasMode(connection.me, '@') || event.channel.userHasMode(connection.me, '%')) {
                if (event.params.length > 0) {
                    var nick = event.params[0],
                        reason = event.params.length > 1 ? event.text.substr(nick.length + 1) : '-';
                    if (event.channel.isUserInChannel(nick)) {
                        connection.getUser(nick).whois(function (data) {
                            event.channel.ban(data.nick + '!' + data.username + '@' + data.hostname);
                            event.channel.kick(nick, '(' + event.user.getNick() + ') ' + reason);
                        });
                    } else {
                        event.user.notice('Sorry, i can\'t find ' + nick + ' in ' + event.channel.getName());
                    }
                } else {
                    event.user.notice('Use: !kickban <nick> [reason]');
                }
            } else {
                event.user.notice('I don\'t have the permissions to kickban someone in this channel.');
            }
        } else {
            event.user.notice('You don\'t have the permissions to use this command.');
        }
    });
};