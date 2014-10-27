var Cleverbot   = require('cleverbot-node');
var Entities    = require('html-entities').AllHtmlEntities;

module.exports = function (scriptLoader) {
    var cb = new Cleverbot(),
        entities = new Entities();

    scriptLoader.on('message', function (event) {
        if (event.message.indexOf(scriptLoader.connection.me.getNick() + ':') === 0) {
            var text = event.message.substr((scriptLoader.connection.me.getNick() + ':').length).trim();
            cb.write(text, function (response) {
                event.channel.reply(event.user, entities.decode(response.message));
            });
        }
    });
};