'use strict';
var _ = require('underscore');

module.exports = function (scriptLoader, glados) {
    scriptLoader.registerCommand(['roll', 'dice'], function (connection, event) {
        var min, max;
        if (event.params.length === 0) {
            event.channel.reply(event.user, _.random(100));
        } else if (event.params.length === 1) {
            max = parseInt(event.params[0], 10);
            if (_.isNaN(max)) {
                max = 100;
            }
            event.channel.reply(event.user, _.random(max));
        } else if (event.params.length === 2) {
            min = parseInt(event.params[0], 10);
            if (_.isNaN(min)) {
                min = 0;
            }
            max = parseInt(event.params[1], 10);
            if (_.isNaN(max)) {
                max = 100;
            }
            event.channel.reply(event.user, _.random(min, max));
        }
    });
};