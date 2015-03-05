var morse = require('morse');

exports.register = function (glados, next) {

    glados.hear(/^!morse(:dec)?( .+)?$/i, function (match, event) {
        var dec = !!match[1];
        var msg = match[2] ? match[2].trim() : null;
        if (!msg) {
            if (dec) {
                return event.user.notice('Benutze: !morse:dec <Morsezeichen>');
            } else {
                return event.user.notice('Benutze: !morse <Text>');
            }
        }
        if (dec) {
            event.channel.reply(event.user, morse.decode(msg));
        } else {
            event.channel.reply(event.user, morse.encode(msg));
        }
    });


    return next();
};
exports.info = {
    name: 'morse',
    displayName: 'Morse',
    desc: ['Morsezeichen (de-)kodierung.'],
    version: '1.0.0',
    commands: [{
        name: 'morse',
        params: {
            'Text': 'required'
        },
        desc: ['Kodiert den angegebenen Text in Morsezeichen und gibt ihn aus.']
    },{
        name: 'morse:dec',
        params: {
            'Morsezeichen': 'required'
        },
        desc: ['Dekodiert die angegebenen Morsezeichen und gibt den Text aus.']
    }]
};