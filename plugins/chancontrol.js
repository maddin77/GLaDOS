/*global GLaDOS */
'use strict';
GLaDOS.register({
    'name': 'chancontrol',
    'description': [
        'Provides some useful functions to control a channel.',
        'These commands are only available if GLaDOS and the user who uses the command have both at least Half-Op in the channel.'
    ],
    'commands': [
        '!kick <nick> [reason] - Kick <nick> from the channel.',
        '!ban <nick or hostmask> - Ban <nick or hostmask> from the channel.',
        '!unban <hostmask> - Unban <hostmask> from the channel.',
        '!kickban <nick> [reason] - Ban <nick>\'s hostmask and kick him from the channel.'
    ]
}, function (ircEvent, command) {
    command(['kick', 'k'], function (channel, user, name, text, params) {
        if (!channel.userHasMinMode(user.getNick(), '%')) {
            return user.notice('you don\'t have the permissions to use this command.');
        }
        if (!channel.userHasMinMode(GLaDOS.getUser().getNick(), '%')) {
            return user.notice('i don\'t have the permissions to kick someone in this channel.');
        }
        if (params.length === 0) {
            return user.notice('!kick <nick> [reason]');
        }
        var nick = params[0], kickUser;
        if (!channel.userExistInChannel(nick)) {
            return user.notice('"' + nick + '" doesn\'t exist.');
        }
        kickUser = GLaDOS.getUser(nick);
        if (params.length > 1) {
            channel.kick(kickUser.getNick(), '(' + user.getNick() + ') ' + text.slice(kickUser.getNick().length + 1));
        } else {
            channel.kick(kickUser.getNick(), '(' + user.getNick() + ') -');
        }
    });
    command(['ban', 'b'], function (channel, user, name, text, params) {
        if (!channel.userHasMinMode(user.getNick(), '%')) {
            return user.notice('you don\'t have the permissions to use this command.');
        }
        if (!channel.userHasMinMode(GLaDOS.getUser().getNick(), '%')) {
            return user.notice('i don\'t have the permissions to ban someone in this channel.');
        }
        if (params.length === 0) {
            return user.notice('!ban <nick or hostmask>');
        }
        var nick, banUser, hostmask;
        if (params[0].indexOf('!') === -1 && params[0].indexOf('@') === -1) {
            nick = params[0];
            if (!channel.userExistInChannel(nick)) {
                return user.notice('"' + nick + '" doesn\'t exist.');
            }
            banUser = GLaDOS.getUser(nick);
            banUser.whois(function () {
                channel.ban('*!*@' + banUser.getHost());
            });
        } else {
            hostmask = params[0];
            if (hostmask.indexOf('!') === -1 || hostmask.indexOf('@') === -1) {
                return user.notice('that\'s not a valid hostmask.');
            }
            channel.ban(hostmask);
        }
    });
    command(['unban', 'ub'], function (channel, user, name, text, params) {
        if (!channel.userHasMinMode(user.getNick(), '%')) {
            return user.notice('you don\'t have the permissions to use this command.');
        }
        if (!channel.userHasMinMode(GLaDOS.getUser().getNick(), '%')) {
            return user.notice('i don\'t have the permissions to unban someone in this channel.');
        }
        if (params.length === 0) {
            return user.notice('!unban <hostmask>');
        }
        var mask = params[0];
        if (mask.indexOf('!') === -1 || mask.indexOf('@') === -1) {
            return user.notice('that\'s not a valid hostmask.');
        }
        channel.unban(mask);
    });
    command(['kickban', 'kb'], function (channel, user, name, text, params) {
        if (!channel.userHasMinMode(user.getNick(), '%')) {
            return user.notice('you don\'t have the permissions to use this command.');
        }
        if (!channel.userHasMinMode(GLaDOS.getUser().getNick(), '%')) {
            return user.notice('i don\'t have the permissions to kick & ban someone in this channel.');
        }
        if (params.length === 0) {
            return user.notice('!kickban <nick> [reason]');
        }
        var nick = params[0], kickBanUser;
        if (!channel.userExistInChannel(nick)) {
            return user.notice('"' + nick + '" doesn\'t exist.');
        }
        kickBanUser = GLaDOS.getUser(nick);
        kickBanUser.whois(function () {
            channel.ban('*!*@' + kickBanUser.getHost());
        });
        if (params.length > 1) {
            channel.kick(kickBanUser.getNick(), '(' + user.getNick() + ') ' + text.slice(kickBanUser.getNick().length + 1));
        } else {
            channel.kick(kickBanUser.getNick(), '(' + user.getNick() + ') -');
        }
    });
});