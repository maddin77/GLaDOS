var _ = require('lodash');

exports.register = function (glados, next) {
    var seegras = function (nick) {
        return nick + (nick.indexOf('s', nick.length - 1) !== -1 ? '\'' : 's');
    };
    glados.hear(/^!icksdeh( \S+)?$/i, function (match, event) {
        var displaynick = match[1] ? match[1].trim() : event.user.getNick();
        var nick = displaynick.toLowerCase();
        var xD = glados.brain('icksdeh').object[nick] || 0;
        event.channel.say('%s Anti Benis: %s € (%sx)', seegras(displaynick), Math.round((xD * 0.1) * 100) / 100, xD);
    });
    glados.hear(/\bx(d+)\b/gmi, function (match, event) {
        var count = _.reduce(match, function (sum, n) {
            return sum + n.length - 1;
        }, 0);
        var nick = event.user.getNick().toLowerCase();
        var icksdeh = glados.brain('icksdeh');
        if (!_.has(icksdeh.object, nick)) {
            icksdeh.object[nick] = count;
        } else {
            icksdeh.object[nick] += count;
        }
        icksdeh.save();
    });
    return next();
};
exports.info = {
    name: 'icksdeh',
    displayName: 'xD',
    desc: ['Anti-Benis-Meter'],
    version: '1.0.0',
    commands: [{
        name: 'icksdeh',
        params: {
            'Nick': 'optional'
        },
        desc: [
            'Gibt den Anti-Benis des angegebenen Benutzers aus.',
            'Ist kein Nick angegeben so wird der eigene Anti-Benis ausgegeben.'
        ]
    }],
    hear: [{
        name: 'xd',
        hear: 'xD',
        desc: ['Erhöht den Anti-Benis um 10ct pro "D".']
    }]
};