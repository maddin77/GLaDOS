'use strict';
var request = require('request');
var debug = require('debug')('GLaDOS:script:heartbleed');

module.exports = function (scriptLoader, irc) {
    scriptLoader.registerCommand('heartbleed', function (event) {
        if (event.params.length > 0) {
            request({
                "uri": 'https://hbelb.filippo.io/bleed/' + encodeURIComponent(event.text),
                "headers": {
                    "User-Agent": irc.config.userAgent
                },
                "json": true
            }, function (error, response, data) {
                if (!error && response.statusCode === 200) {
                    if (data.error) {
                        event.channel.reply(event.user, data.error);
                    } else {
                        if (data.code === 0) {
                            event.channel.reply(event.user, data.host + ' IS VULNERABLE.');
                        } else {
                            event.channel.reply(event.user, 'All good, ' + data.host + ' seems fixed or unaffected!');
                        }
                    }
                } else {
                    event.channel.reply(event.user, 'Gratz. You broke it. (' + error + ')');
                    debug('%s', error);
                }
            });
        } else {
            event.user.notice('Use: !heartbleed <URL or hostname>');
        }
    });
};