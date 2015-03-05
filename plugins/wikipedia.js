var request = require('request');

exports.register = function (glados, next) {
    glados.hear(/^!(?:wikipedia|wiki)( .+)?$/i, function (match, event) {
        var term = match[1] ? match[1].trim() : null;
        if (!term) {
            return event.user.notice('Benutze: !wikipedia <Suchbegriff(e)>');
        }
        request({
            'uri': 'https://de.wikipedia.org/w/api.php',
            'qs': {
                'action': 'opensearch',
                'limit': 1,
                'format': 'json',
                'search': term,
                'namespace': 0,
                'redirects': 'resolve'
            },
            'json': true,
            'headers': {
                'User-Agent': glados.config.object.userAgent
            }
        }, function (error, response, data) {
            if (!error && response.statusCode === 200) {
                if (data[1].length === 0) {
                    return event.channel.reply(event.user, 'Zu deiner Suchanfrage wurden keine Ergebnisse gefunden.');
                }
                event.channel.reply(event.user, data[2][0]);
            } else {
                event.channel.reply(event.user, 'Gratz. You broke it. (' + error + ')');
                glados.debug('%s', error);
            }
        });
    });

    return next();
};
exports.info = {
    name: 'wikipedia',
    displayName: 'Wikipedia',
    desc: ['Wikipedia Zusammenfassungen.'],
    version: '1.0.0',
    commands: [{
        name: 'wikipedia',
        alias: ['wiki'],
        params: {
            'Suchbegriff(e)': 'required'
        },
        desc: ['Sucht via Wikipedia nach den angegebenen Suchbegriffen und gibt eine Zusammenfassung aus.']
    }]
};