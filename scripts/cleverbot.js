'use strict';
var Cleverbot = require('cleverbot-node');
var Entities = require('html-entities').AllHtmlEntities;

module.exports = function () {
    var cb = new Cleverbot(),
        entities = new Entities();

    return function (irc) {
        irc.on('chanmsg', function (event) {
            if (event.message.indexOf(irc.config.irc.nick + ':') === 0) {
                var text = event.message.substr((irc.config.irc.nick + ':').length).trim();
                cb.write(text, function (response) {
                    event.channel.reply(event.user, entities.decode(response.message));
                });
            }
        });
    };
};