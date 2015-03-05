var flip = require('flip');

exports.register = function (glados, next) {
    glados.hear(/^!flip( .+)?$/i, function (match, event) {
        var text = match[1] ? match[1].trim() : null;
        if (!text) {
            return event.user.notice('Benutze: !flip <Text>');
        }
        event.channel.reply(event.user, '(╯°□°）╯︵ ' + flip(text));
    });
    return next();
};
exports.info = {
    name: 'flip',
    displayName: 'Flip',
    desc: ['┻━┻ ︵ヽ(`Д´)ﾉ︵ ┻━┻'],
    version: '1.0.0',
    commands: [{
        name: 'flip',
        params: {
            'Text': 'required'
        },
        desc: ['Stellt den angegebenen Text auf den Kopf.']
    }]
};