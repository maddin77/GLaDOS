'use strict';
var request = require('request');
var debug = require('debug')('GLaDOS:script:urbandictionary');

module.exports = function (irc) {
    irc.command(['ud', 'urban', 'urbandictionary'], function (event) {
        if (event.params.length > 0) {
            request({
                "uri": 'http://api.urbandictionary.com/v0/define?term=' + encodeURIComponent(event.text),
                "json": true,
                "headers": {
                    "User-Agent": irc.config.userAgent
                }
            }, function (error, response, data) {
                if (!error && response.statusCode === 200) {
                    if (data.list.length === 0) {
                        event.channel.reply(event.user, 'No results found for "' + event.text + '".');
                    } else {
                        var entry = data.list[0];
                        event.channel.say(entry.word + ': ' + entry.definition);
                        if (entry.example) {
                            event.channel.say('Example: ' + entry.example);
                        }
                    }
                } else {
                    event.channel.reply(event.user, 'Gratz. You broke it. (' + error + ')');
                    debug('%s', error);
                }
            });
        } else {
            event.user.notice('Use: !urbandictionary <term>');
        }
    });
};