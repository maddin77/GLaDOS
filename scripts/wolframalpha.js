'use strict';
var request = require('request');
var querystring = require('querystring');
var parseString = require('xml2js').parseString;
var _ = require('underscore');
var debug = require('debug')('GLaDOS:script:wolframalpha');

module.exports = function (scriptLoader, irc) {

    var wadb        = irc.database('wolframalpha');
    wadb.key        = wadb.key || '';
    wadb.useragent  = wadb.useragent || irc.config.userAgent;
    wadb.save();

    scriptLoader.registerCommand(['wa', 'wolfram', 'wolframalpha'], function (event) {
        if (event.params.length > 0) {
            var uri = 'http://api.wolframalpha.com/v2/query?' + querystring.stringify({
                "input": event.text,
                "units": 'metric',
                "format": "plaintext",
                "primary": true,
                "appid": wadb.key
            });
            request({
                "uri": uri,
                "headers": {
                    "User-Agent": wadb.useragent
                }
            }, function (error, response, body) {
                if (!error && response.statusCode === 200) {
                    parseString(body, function (err, data) {
                        if (data.queryresult.$.error === 'false') {
                            var input, primary, secondary;

                            input = _.find(data.queryresult.pod, function (pod) {
                                return pod.$.id && pod.$.id === 'Input';
                            });
                            if (input) {
                                input = _.map(input.subpod, function (subpod) {
                                    return subpod.plaintext[0];
                                }).join(', ');
                            } else {
                                input = event.text;
                            }
                            debug('input = %s', input);

                            primary = _.find(data.queryresult.pod, function (pod) {
                                return pod.$.primary && pod.$.primary === 'true';
                            });
                            if (primary) {
                                primary = primary.$.title + ': ' + _.map(primary.subpod, function (subpod) {
                                    return subpod.plaintext[0];
                                }).join(', ').split('\n').join(', ');
                            }
                            debug('primary = %s', primary);

                            secondary = _.find(data.queryresult.pod, function (pod) {
                                return !(pod.$.id && pod.$.id === 'Input') && !(pod.$.primary && pod.$.primary === 'true') && pod.subpod[0].plaintext[0].length !== 0;
                            });
                            if (secondary) {
                                secondary = secondary.$.title + ': ' + _.map(secondary.subpod, function (subpod) {
                                    return subpod.plaintext[0];
                                }).join(', ').split('\n').join(', ');
                            }
                            debug('secondary = %s', secondary);
                            event.channel.reply(event.user, input + '. ' + (primary || secondary || 'No primary result.'));
                        } else {
                            event.channel.reply(event.user, data.queryresult.error.msg);
                        }
                    });
                } else {
                    event.channel.reply(event.user, 'Gratz. You broke it. (' + error + ')');
                    debug('%s', error);
                }
            });
        } else {
            event.user.notice('Use: !wolframalpha <query>');
        }
    });
};