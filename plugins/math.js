/*global GLaDOS */
'use strict';
var request = require('request');
var math = require('mathjs')();
GLaDOS.register({
    'name': 'math',
    'desc': [
        'Do some math stuff.'
    ],
    'commands': [
        '!number [number] [type] - Get an interesting fact about [number]. Default [number] is random. Type can either be trivia, year, date or math. Default [type] is trivia.',
    ]
}, function (ircEvent, command) {
    command(['number', 'num'], function (channel, user, name, text, params) {
        var number = params.length > 0 ? parseInt(params[0], 10) : 'random',
            type = params.length > 1 ? params[1] : 'trivia';
        request({
            uri: 'http://numbersapi.com/' + number + '/' + type
        }, function (error, response, body) {
            if (!error && response.statusCode === 200) {
                channel.say(user.getNick() + ': ' + body);
            } else {
                channel.say(user.getNick() + ': Unknown error.');
            }
        });
    });

    /*command(['calculate', 'calc', 'c', 'math'], function(channel, user, name, text, params) {
        if( params.length === 0 ) return user.notice('!math <expression>');
        try {
            var ret = math.eval(text);
            GLaDOS.logger.debug('[math] %j', ret, ret);
            channel.say(user.getNick() + ": " + ret);
        }
        catch(e) {
            channel.say(user.getNick() + ": " + e);
        }
    });*/
});