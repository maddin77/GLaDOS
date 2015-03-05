var _       = require('lodash');

exports.register = function (glados, next) {
    glados.hear(/^!(?:dice|roll)( \d+)?( \d+)?$/i, function (match, event) {
        var min = match[1] ? parseInt(match[1].trim(), 10) : 0;
        var max = match[2] ? parseInt(match[2].trim(), 10) : 100;
        event.channel.reply(event.user, _.random(min, max));
    });
    return next();
};
exports.info = {
    name: 'dice',
    displayName: 'Würfel/Random',
    desc: ['Need Before Greed.'],
    version: '1.0.0',
    commands: [{
        name: 'dice',
        alias: ['roll'],
        params: {
            'Mindestwert': 'optional',
            'Maximalwert': 'optional'
        },
        desc: [
            'Gibt eine Zufällige Zahl zwischen (inklusive) Mindest- und Maximalwert zurück.',
            'Der Standard Mindestwert ist 0.',
            'Der Standard Maximalwert ist 100.'
        ]
    }]
};