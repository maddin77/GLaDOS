module.exports = function (scriptLoader) {
    scriptLoader.on('command', ['k', 'kick'], function (event) {
        if (event.channel.userHasMinMode(event.user, '%')) {
            if (event.channel.userHasMinMode(scriptLoader.connection.me, '%')) {
                if (event.params.length > 0) {
                    var nick = event.params[0],
                        reason = event.params.length > 1 ? event.text.substr(nick.length + 1) : '-';
                    if (event.channel.isUserInChannel(nick)) {
                        event.channel.kick(nick, '(' + event.user.getNick() + ') ' + reason);
                    } else {
                        event.user.notice('Sorry, i can\'t find %s in %s.', event.user.getNick(), event.channel.getName());
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
    scriptLoader.on('command', ['b', 'ban'], function (event) {
        if (event.channel.userHasMinMode(event.user, '%')) {
            if (event.channel.userHasMinMode(scriptLoader.connection.me, '%')) {
                if (event.params.length > 0) {
                    var mask = event.params[0];
                    if (mask.indexOf('!') === -1 && mask.indexOf('@') === -1) {
                        if (event.channel.isUserInChannel(mask)) {
                            scriptLoader.connection.getUser(mask).whois(function (err, data) {
                                if (err) {
                                    event.user.notice('Sorry, i can\'t find %s in %s.', mask, event.channel.getName());
                                } else {
                                    event.channel.ban(data.nick + '!' + data.username + '@' + data.hostname);
                                }
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
    scriptLoader.on('command', ['ub', 'unban'], function (event) {
        if (event.channel.userHasMinMode(event.user, '%')) {
            if (event.channel.userHasMinMode(scriptLoader.connection.me, '%')) {
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
    scriptLoader.on('command', ['kb', 'kickban'], function (event) {
        if (event.channel.userHasMinMode(event.user, '%')) {
            if (event.channel.userHasMinMode(scriptLoader.connection.me, '%')) {
                if (event.params.length > 0) {
                    var nick = event.params[0],
                        reason = event.params.length > 1 ? event.text.substr(nick.length + 1) : '-';
                    if (event.channel.isUserInChannel(nick)) {
                        scriptLoader.connection.getUser(nick).whois(function (data) {
                            event.channel.ban(data.nick + '!' + data.username + '@' + data.hostname);
                            event.channel.kick(nick, '(' + event.user.getNick() + ') ' + reason);
                        });
                    } else {
                        event.user.notice('Sorry, i can\'t find %s in %s.', nick, event.channel.getName());
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