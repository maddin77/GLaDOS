var Cleverbot   = require('cleverbot-node');
var Entities    = require('html-entities').AllHtmlEntities;

exports.register = function (glados, next) {
    var cb = new Cleverbot(),
        entities = new Entities();

    glados.on('privmsg', function (event, client) {
        if (event.message.toLowerCase().indexOf(client.irc._nick.toLowerCase() + ':') === 0) {
            var text = event.message.substr((client.irc._nick + ':').length).trim();
            cb.write(text, function (response) {
                client.irc.privmsg(event.target, event.nickname + ': ' + entities.decode(response.message));
            });
        }
    });

    return next();
};
exports.attributes = {
    name: 'cleverbot',
    version: '1.0.0',
};