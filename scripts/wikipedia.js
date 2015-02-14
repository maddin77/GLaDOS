'use strict';
var request = require('request');
var dns = require('dns');
var debug = require('debug')('GLaDOS:script:wikipedia');

module.exports = function (scriptLoader, irc) {
    scriptLoader.registerCommand(['wiki', 'wikipedia'], function (event) {
        if (event.params.length > 0) {
            dns.resolveTxt(event.params.join('_') + ".wp.dg.cx", function (error, txt) {
                if (!error) {
                    event.channel.reply(event.user, txt[0]);
                } else {
                    event.channel.reply(event.user, 'There were no results matching the query.');
                    debug('[wiki] %s', error);
                }
            });
        } else {
            event.user.notice('Use: !wikipedia <term>');
        }
    });
    scriptLoader.registerCommand(['syno', 'synonym'], function (event) {
        if (event.params.length > 0) {
            request({
                "uri": 'http://wikisynonyms.ipeirotis.com/api/' + event.text,
                "json": true,
                "headers": {
                    "User-Agent": irc.config.userAgent
                }
            }, function (error, response, body) {
                if (!error && response.statusCode === 200) {
                    if (body.http === 200) {
                        var terms = [], i;
                        for (i = 0; i < 10 && i < body.terms.length; i += 1) {
                            terms.push(body.terms[i].term);
                        }
                        event.channel.reply(event.user, terms.join(', '));
                    } else {
                        if (body.message === 'Multiple matches found because of ambiguous capitalization of the query. Please query again with one of the returned terms') {
                            event.channel.reply(event.user, body.message + ': ' + body.terms.slice(0, 10).join(', '));
                        } else if (body.message === 'The entry is a disambiguation page in Wikipedia. Please query again with one of the returned terms') {
                            event.channel.reply(event.user, body.message + ': ' + body.terms.slice(0, 10).join(', '));
                        } else {
                            event.channel.reply(event.user, body.message);
                        }
                    }
                } else {
                    event.channel.reply(event.user, 'Gratz. You broke it. (' + error + ')');
                    debug('[syno] %s', error);
                }
            });
        } else {
            event.user.notice('Use: !synonym <term or phrase>');
        }
    });
};