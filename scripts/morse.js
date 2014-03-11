'use strict';
var morse = require('morse');

module.exports = function () {
    return function (irc) {
        irc.command('morse', function (event) {
            if (event.params.length > 0) {
                event.channel.reply(event.user, morse.encode(event.text));
            } else {
                event.user.notice('Use: !morse <string>');
            }
        });
    };
};