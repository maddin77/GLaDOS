'use strict';
var morse = require('morse');

module.exports = function (irc) {
    irc.command('morse', function (event) {
        if (event.params.length > 1) {
            if (event.params[0].toUpperCase() === 'ENCODE') {
                event.channel.reply(event.user, morse.encode(event.text.substr(7)));
            } else if (event.params[0].toUpperCase() === 'DECODE') {
                event.channel.reply(event.user, morse.decode(event.text.substr(7)));
            } else {
                event.user.notice('Use: !morse <ENCODE/DECODE> <string>');
            }
        } else {
            event.user.notice('Use: !morse <ENCODE/DECODE> <string>');
        }
    });
};