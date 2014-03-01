/*global GLaDOS */
'use strict';
var request = require('request');
var util = require('util');
GLaDOS.register({
    'name': 'translate',
    'description': 'Translate words of full sentences from one langauge to another.',
    'commands': '!translate <source language> <target language> <sentence>'
}, function (ircEvent, command) {
    command(['translate', 't'], function (channel, user, name, text, params) {
        if (params.length < 3) {
            return user.notice('!translate <source language> <target language> <sentence>');
        }
        var source = params[0],
            target = params[1],
            sentence = text.substring(source.length + target.length + 2);
        request({
            uri: 'http://api.mymemory.translated.net/get?q=' + encodeURIComponent(sentence) + '&langpair=' + source + '|' + target,
            json: true
        }, function (error, response, data) {
            if (!error && response.statusCode === 200) {
                if (data.responseStatus === 200) {
                    channel.say(user.getNick() + ': ' + data.responseData.translatedText);
                } else {
                    channel.say(user.getNick() + ': ' + data.responseDetails);
                }
            } else {
                GLaDOS.logger.error('[translate] %s', (error || 'Unknown Error'), error);
                channel.say(user.getNick() + ': ' + (error || 'Unknown Error'));
            }
        });
    });
});