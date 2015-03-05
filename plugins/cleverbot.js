var Cleverbot   = require('cleverbot-node');
var Entities    = require('html-entities').AllHtmlEntities;

exports.register = function (glados, next) {
    var cb = new Cleverbot(),
        entities = new Entities();

    glados.hear(/^GLaDOS: (.*)$/i, function (match, event) {
        cb.write(match[1], function (response) {
            event.channel.reply(event.user, entities.decode(response.message));
        });
    });

    return next();
};
exports.info = {
    name: 'cleverbot',
    displayName: 'Cleverbot',
    desc: ['Bietet die möglichkeit durch GLaDOS mit der Cleverbot API zu interagieren.'],
    version: '1.0.0',
    hear: [{
        name: 'cleverbot',
        hear: 'GLaDOS: <Text>',
        desc: ['Schickt <Text> an die Cleverbot-API und gibt das Ergebniss zurück.']
    }]
};