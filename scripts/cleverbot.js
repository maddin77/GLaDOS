'use strict';
var Cleverbot = require('cleverbot-node');
var Entities = require('html-entities').AllHtmlEntities;

module.exports = function (scriptLoader, glados) {
    var cb = new Cleverbot(),
        entities = new Entities();

    scriptLoader.registerEvent('message', function (connection, event) {
        if (event.message.indexOf(connection.me.getNick() + ':') === 0) {
            var text = event.message.substr((connection.me.getNick() + ':').length).trim();
            cb.write(text, function (response) {
                event.channel.reply(event.user, entities.decode(response.message));
            });
        }
    });
};