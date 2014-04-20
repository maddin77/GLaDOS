'use strict';
var Sandbox = require('sandbox');
var sandbox = new Sandbox();

module.exports = function (irc) {
    irc.command(['sandbox', 'c', 'calc', 'calculate', 'math'], function (event) {
        if (event.params.length > 0) {
            sandbox.run(event.text, function (output) {
                event.channel.reply(event.user, output.result);
            });
        } else {
            event.user.notice('Use: !sandbox <code>');
        }
    });
};