/*global GLaDOS */
'use strict';
var morse = require('morse');
GLaDOS.register({
    'name': 'morse',
    'description': 'Converts a String to Morse code.',
    'commands': '!morse <string>'
}, function (ircEvent, command) {
    command('morse', function (channel, user, name, text, params) {
        if (params.length === 0) {
            return user.notice('!morse <string>');
        }
        channel.say(user.getNick() + ": " + morse.encode(text));
    });
});