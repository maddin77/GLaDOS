var request = require('request');

exports.register = function (glados, next) {
    glados.hear(/^!(?:translate|t)( \S+)?( \S+)?( .+)?$/i, function (match, event) {
        var source = match[1] ? match[1].trim() : null;
        var target = match[2] ? match[2].trim() : null;
        var sentence = match[3] ? match[3].trim() : null;
        if (!source || !target || !sentence) {
            return event.user.notice('Benutze: !translate <Ausgangssprache> <Zielsprache> <Text>');
        }
        request({
            'uri': 'http://api.mymemory.translated.net/get?q=' + encodeURIComponent(sentence) + '&langpair=' + source + '|' + target,
            'json': true,
            'headers': {
                'User-Agent': glados.config.object.userAgent
            }
        }, function (error, response, data) {
            if (!error && response.statusCode === 200) {
                if (data.responseStatus === 200) {
                    event.channel.reply(event.user, data.responseData.translatedText);
                } else {
                    event.channel.reply(event.user, data.responseDetails);
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
    name: 'translate',
    displayName: 'Übersetzung',
    desc: ['Text übersetzen.'],
    version: '1.0.0',
    commands: [{
        name: 'translate',
        alias: ['t'],
        params: {
            'Ausgangssprache': 'required',
            'Zielsprache': 'required',
            'Text': 'required'
        },
        desc: ['Übersetzt den angegebenen Text von der Ausgangssprache in die Zielsprache.']
    }]
};