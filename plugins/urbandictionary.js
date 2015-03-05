var request = require('request');

exports.register = function (glados, next) {
    glados.hear(/^!(?:urbandictionary|ud)( .+)?$/i, function (match, event) {
        var sentence = match[1] ? match[1].trim() : null;
        if (!sentence) {
            return event.user.notice('Benutze: !urbandictionary <Begriff(e)>');
        }
        request({
            'uri': 'http://api.urbandictionary.com/v0/define?term=' + encodeURIComponent(sentence),
            'json': true,
            'headers': {
                'User-Agent': glados.config.object.userAgent
            }
        }, function (error, response, data) {
            if (!error && response.statusCode === 200) {
                if (data.list.length === 0) {
                    event.channel.reply(event.user, 'Keine Ergebnisse für "' +sentence + '" gefunden.');
                } else {
                    var entry = data.list[0];
                    event.channel.say(entry.word + ': ' + entry.definition);
                    if (entry.example) {
                        event.channel.say('Beispiel: ' + entry.example);
                    }
                }
            } else {
                event.channel.reply(event.user, 'Gratz. You broke it. (' + error + ')');
                glados.debug('%s', error);
            }
        });
    });

    return next();
};
exports.info = {
    name: 'urbandictionary',
    displayName: 'Urbandictionary',
    desc: ['Urbandictionary Definitionen.'],
    version: '1.0.0',
    commands: [{
        name: 'urbandictionary',
        alias: ['ud'],
        params: {
            'Begriff(e)': 'required'
        },
        desc: ['Gibt die Urbandictionary Definition von den angegebenen Begriffen zurück zurück.']
    }]
};