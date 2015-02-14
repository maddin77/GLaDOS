/*global GLaDOS */
'use strict';
var google = require('google');
var util = require('util');
GLaDOS.register({
    'name': 'google',
    'description': 'Returns the url and title of the first google hit for a query.',
    'commands': '!google <query>'
}, function (ircEvent, command) {
    command(['google', 'g'], function (channel, user, name, text, params) {
        if (params.length === 0) {
            return user.notice('!google <query>');
        }
        google(text, function (error, next, links) {
            if (!error) {
                if (links.length > 0) {
                    channel.say(user.getNick() + ': ' + links[0].title + ' (' + links[0].link + ')');
                } else {
                    channel.say(user.getNick() + ': your search - ' + text + ' - did not match any documents.');
                }
            } else {
                GLaDOS.logger.error('[google] %s', (error || 'Unknown Error'), error);
                channel.say(user.getNick() + ': ' + (error || 'Unknown Error'));
            }
        });
    });
});