var google  = require('google');
var _       = require('lodash');

exports.register = function (glados, next) {
    google.lang = 'de';
    google.tld = 'de';

    glados.hear(/^!g(?:oogle)?(\:\d+)?( .+)?$/i, function (match, event) {
        var count = match[1] ? (_.parseInt(match[1].trim().substr(1)) || 1) : 1;
        var text = match[2] ? match[2].trim() : null;
        if (!text) {
            return event.user.notice('Benutze: !google[:Anzahl] <Suchbegriff(e)>');
        }
        google(text, function (error, next, links) {
            if (error) {
                glados.debug(error);
                return event.channel.reply(event.user, '（╯°□°）╯︵ Error:' + error);
            }
            var results = [];
            if (links.length > 0) {
                results = _.filter(links, function (l) {
                    return !_.isNull(l.link) && !_.isNull(l.title) && !_.isNull(l.description);
                });
            }
            if (links.length <= 0 || results.length <= 0) {
                return event.channel.reply(event.user, 'Es wurden keine mit Ihrer Suchanfrage - ' + text + ' - übereinstimmenden Dokumente gefunden.');
            }
            _.each(_.slice(results, 0, count), function (r) {
                event.channel.reply(event.user, r.title + ' (' + r.link + ') ' + r.description.replace(/(\r\n|\n|\r)/gm, ''));
            });
        });
    });
    return next();
};
exports.info = {
    name: 'google',
    displayName: 'Google',
    desc: ['Google Suchhilfe.'],
    version: '1.0.0',
    commands: [{
        name: 'google[:Anzahl]',
        alias: ['g'],
        params: {
            'Suchbegriff(e)': 'required'
        },
        desc: [
            'Sucht nach den angegeben Suchbegriffen via Google und gibt das erste Ergebniss zurück.',
            'Optional kann auch die Anzahl der gewünschten Suchergebnisse angegeben werden:',
            '"!google:3 Mettigel" gibt so die ersten 3 Suchergebnisse zu Mettigel zurück.'
        ]
    }]
};