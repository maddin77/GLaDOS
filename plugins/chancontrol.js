exports.register = function (glados, next) {

    glados.hear(/^!k(?:ick)?( \S+)?( .+)?$/i, function (match, event) {
        if (!event.channel.userHasMinMode(this.me.nick, '%')) {
            return event.user.notice('Ich habe nicht die nötigen Rechte um User aus diesem Channel zu kicken.');
        }
        if (!event.channel.userHasMinMode(event.user, '%')) {
            return event.user.notice('Du bist nicht berechtigt andere User aus diesem Channel zu kicken.');
        }
        var nick = match[1];
        var reason = match[2] || '-';

        if (!nick) {
            return event.user.notice('Benutze: !kick <Nick> [Grund]');
        }
        nick = nick.trim();
        if (!event.channel.isUserInChannel(nick)) {
            return event.user.notice('Sorry, ich kann %s nicht finden ¯\\_(ツ)_/¯', nick);
        }
        event.channel.kick(nick, '(' + event.user.getNick() + ') ' + reason.trim());
    });
    glados.hear(/^!b(?:an)?( \S+)?$/i, function (match, event) {
        if (!event.channel.userHasMinMode(this.me.nick, '%')) {
            return event.user.notice('Ich habe nicht die nötigen Rechte um User aus diesem Channel zu bannen.');
        }
        if (!event.channel.userHasMinMode(event.user, '%')) {
            return event.user.notice('Du bist nicht berechtigt andere User aus diesem Channel zu bannen.');
        }
        var mask = match[1];
        if (!mask) {
            return event.user.notice('Benutze: !ban <Nick|Hostmask>');
        }
        mask = mask.trim();
        if (/^\S+!\S+@\S+$/i.test(mask)) {
            return event.channel.ban(mask);
        }
        return this.whois(mask, function (err, data) {
            if (err) {
                glados.debug(err);
                return event.user.notice(err.toString());
            }
            event.channel.ban(data.nick + '!' + data.username + '@' + data.hostname);
        });
    });
    glados.hear(/^!(?:ub|unban)?( \S+)?$/i, function (match, event) {
        if (!event.channel.userHasMinMode(this.me.nick, '%')) {
            return event.user.notice('Ich habe nicht die nötigen Rechte um User in diesem Channel zu entbannen.');
        }
        if (!event.channel.userHasMinMode(event.user, '%')) {
            return event.user.notice('Du bist nicht berechtigt andere User in diesem Channel zu entbannen.');
        }
        var mask = match[1];
        if (!mask) {
            return event.user.notice('Benutze: !unban <Hostmask>');
        }
        return event.channel.unban(mask.trim());
    });
    glados.hear(/^!(?:kb|kickban)?( \S+)?( .+)?$/i, function (match, event) {
        if (!event.channel.userHasMinMode(this.me.nick, '%')) {
            return event.user.notice('Ich habe nicht die nötigen Rechte um User aus diesem Channel zu bannen.');
        }
        if (!event.channel.userHasMinMode(event.user, '%')) {
            return event.user.notice('Du bist nicht berechtigt andere User aus diesem Channel zu bannen.');
        }
        var nick = match[1];
        var reason = match[2] || '-';

        if (!nick) {
            return event.user.notice('Benutze: !kickban <Nick> [Grund]');
        }
        nick = nick.trim();
        if (!event.channel.isUserInChannel(nick)) {
            return event.user.notice('Sorry, ich kann %s nicht finden ¯\\_(ツ)_/¯', nick);
        }
        return this.whois(nick, function (err, data) {
            if (err) {
                err = 'Error: ' + err;
                glados.debug(err);
                return event.user.notice(err.toString());
            }
            event.channel.ban(data.nick + '!' + data.username + '@' + data.hostname);
            event.channel.kick(data.nick, '(' + event.user.getNick() + ') ' + reason.trim());
        });
    });
    return next();
};
exports.info = {
    name: 'chancontrol',
    displayName: 'Channel Moderation',
    desc: ['Bietet verschiedene Befehle um die Moderation eines Channels zu vereinfachen.'],
    version: '1.0.0',
    commands: [{
        name: 'kick',
        alias: ['k'],
        params: {
            'Nick': 'required',
            'Grund': 'optional'
        },
        desc: [
            'Kickt einen Benutzer aus dem Channel.',
            'Optional kann ein Grund angegeben werden, der in der Kick-Nachricht angezeigt wird.',
            'Kann nur von Channel-Operatoren genutzt werden.'
        ]
    },{
        name: 'ban',
        alias: ['b'],
        params: {
            'Hostmask': 'required'
        },
        desc: [
            'Sperrt die Hostmask im Channel.',
            'Kann nur von Channel-Operatoren genutzt werden.'
        ]
    },{
        name: 'ban',
        alias: ['b'],
        params: {
            'Nick': 'required'
        },
        desc: [
            'Sperrt einen Benutzer im Channel.',
            'Die Hostmask wird automatisch via Whois ermittelt.',
            'Kann nur von Channel-Operatoren genutzt werden.'
        ]
    },{
        name: 'unban',
        alias: ['ub'],
        params: {
            'Hostmask': 'required'
        },
        desc: [
            'Hebt die Sperre für die Hostmask im Channel auf.',
            'Kann nur von Channel-Operatoren genutzt werden.'
        ]
    },{
        name: 'kickban',
        alias: ['kb'],
        params: {
            'Nick': 'required',
            'Grund': 'optional'
        },
        desc: [
            'Sperrt die Hostmask des Benutzers und kickt ihn aus dem Channel.',
            'Kann nur von Channel-Operatoren genutzt werden.'
        ]
    }]
};