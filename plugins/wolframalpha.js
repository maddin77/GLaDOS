var request     = require('request');
var parseString = require('xml2js').parseString;
var _           = require('lodash');

exports.register = function (glados, next) {
    glados.hear(/^!(?:wolfram|wa)( .+)?$/i, function (match, event) {
        var term = match[1] ? match[1].trim() : null;
        if (!term) {
            return event.user.notice('Benutze: !wolfram <Formel>');
        }
        request({
            'uri': 'http://api.wolframalpha.com/v2/query',
            'qs': {
                'input': term,
                'units': 'metric',
                'format': 'plaintext',
                'primary': true,
                'appid': glados.config.object.AUTH.wolframalpha
            },
            'headers': {
                'User-Agent': glados.config.object.userAgent
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
                            input = term;
                        }
                        glados.debug('input = %s', input);

                        primary = _.find(data.queryresult.pod, function (pod) {
                            return pod.$.primary && pod.$.primary === 'true';
                        });
                        if (primary) {
                            primary = primary.$.title + ': ' + _.map(primary.subpod, function (subpod) {
                                return subpod.plaintext[0];
                            }).join(', ').split('\n').join(', ');
                        }
                        glados.debug('primary = %s', primary);

                        secondary = _.find(data.queryresult.pod, function (pod) {
                            return !(pod.$.id && pod.$.id === 'Input') && !(pod.$.primary && pod.$.primary === 'true') && pod.subpod[0].plaintext[0].length !== 0;
                        });
                        if (secondary) {
                            secondary = secondary.$.title + ': ' + _.map(secondary.subpod, function (subpod) {
                                return subpod.plaintext[0];
                            }).join(', ').split('\n').join(', ');
                        }
                        glados.debug('secondary = %s', secondary);
                        event.channel.reply(event.user, input + '. ' + (primary || secondary || 'No primary result.'));
                    } else {
                        event.channel.reply(event.user, data.queryresult.error.msg);
                    }
                });
            } else {
                event.channel.reply(event.user, 'Gratz. You broke it. (' + error + ')');
                glados.debug('%s', error);
            }
        });
    });

    return next();
};
exports.info = {
    name: 'wolfram',
    displayName: 'Wolfram Alpha',
    desc: ['Wolfram Alpha.'],
    version: '1.0.0',
    commands: [{
        name: 'wolfram',
        alias: ['wa'],
        params: {
            'Formel': 'required'
        },
        desc: ['Verarbeitet die angegebene Formel via Wolfram Alpha und gibt das Ergebniss aus.']
    }]
};