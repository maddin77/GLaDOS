'use strict';
var Cleverbot = require('cleverbot-node');
var Entities = require('html-entities').AllHtmlEntities;

module.exports = function (scriptLoader, irc) {
    var cb = new Cleverbot(),
        entities = new Entities();

    scriptLoader.registerEvent('message', function (event) {
        if (event.message.indexOf(irc.me.getNick() + ':') === 0) {
            var text = event.message.substr((irc.me.getNick() + ':').length).trim();
            cb.write(text, function (response) {
                event.channel.reply(event.user, entities.decode(response.message));
            });
        }
    });
};