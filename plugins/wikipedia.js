/*global GLaDOS */
'use strict';
var dns = require('dns');
var request = require('request');
var util = require('util');
GLaDOS.register({
    'name': 'wikipedia',
    'description': 'Query Wikipedia for an article summary or synonyms.',
    'commands': [
        '!wikipedia <term> - serach for wikiepdia Summary for the given term.',
        '!synonym <term or phrase> - search for synonyms via wikipedia by the given term or a phrase.'
    ]
}, function (ircEvent, command) {
    command(['wikipedia', 'wiki'], function (channel, user, name, text, params) {
        if (params.length === 0) {
            return user.notice('!wikipedia <term>');
        }
        dns.resolveTxt(params.join('_') + ".wp.dg.cx", function (error, txt) {
            if (!error) {
                channel.say(txt[0]);
            } else {
                channel.say(user.getNick() + ': There were no results matching the query.');
            }
        });
    });
    command(['synonym', 'syno'], function (channel, user, name, text, params) {
        if (params.length === 0) {
            return user.notice('!synonym <term or phrase>');
        }
        request({uri: 'http://wikisynonyms.ipeirotis.com/api/' + text, json: true}, function (error, response, body) {
            if (!error && response.statusCode === 200) {
                if (body.http === 200) {
                    var terms = [], i;
                    for (i = 0; i < 10 && i < body.terms.length; i += 1) {
                        terms.push(body.terms[i].term);
                    }
                    channel.say(user.getNick() + ': ' + terms.join(', '));
                } else {
                    if (body.message === 'Multiple matches found because of ambiguous capitalization of the query. Please query again with one of the returned terms') {
                        channel.say(user.getNick() + ': ' + body.message + ': ' + body.terms.slice(0, 10).join(', '));
                    } else if (body.message === 'The entry is a disambiguation page in Wikipedia. Please query again with one of the returned terms') {
                        channel.say(user.getNick() + ': ' + body.message + ': ' + body.terms.slice(0, 10).join(', '));
                    } else {
                        channel.say(user.getNick() + ': ' + body.message);
                    }
                }
            } else {
                GLaDOS.logger.error('[wikipedia] %s', (error || 'Unknown Error'), error);
                channel.say(user.getNick() + ': ' + (error || 'Unknown Error'));
            }
        });
    });
});