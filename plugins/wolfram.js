/*global GLaDOS */
'use strict';
var request = require('request');
var querystring = require('querystring');
var cheerio = require('cheerio');

function wolfram(input, cb) {
    var uri = 'http://api.wolframalpha.com/v2/query?' + querystring.stringify({
        "input": input,
        "units": 'metric',
        "format": "plaintext",
        "primary": true,
        "appid": GLaDOS.config.get('wolframAlphaKey')
    });
    request(uri, function (error, response, body) {
        if (!error && response.statusCode === 200) {
            var $ = cheerio.load(body, {xmlMode: true}),
                result;
            if ($('queryresult').attr('error') !== 'false') {
                return cb($('queryresult error msg').text(), null);
            }
            result = {
                input: '',
                title: '',
                value: '',
                image: ''
            };
            $('queryresult').find('pod').each(function () {
                var $pod = $(this);
                if ($pod.attr('id') === 'Input' && !result.input) {
                    result.input = $pod.find('subpod plaintext').text();
                }
                if ($pod.attr('primary') && $pod.attr('primary') === 'true' && !result.title) {
                    result.title = $pod.attr('title');
                    $pod.find('subpod').each(function () {
                        var $subpod = $(this);
                        if (!result.value) {
                            result.value = $subpod.find('plaintext').text();
                            result.image = $subpod.find('img').attr('src');
                        }
                    });
                }
            });
            GLaDOS.logger.debug('[wolfram] %j', result, result);
            return cb(null, result);
        }
        cb(error, null);
    });
}

GLaDOS.register({
    'name': 'wolfram',
    'description': 'Use Wolfram Alpha to do stuff.',
    'commands': [
        '!wolfram <query>',
        '!wa <query>'
    ]
}, function (ircEvent, command) {
    command(['wolfram', 'wa', 'calculate', 'calc', 'c', 'math'], function (channel, user, name, text, params) {
        if (params.length === 0) {
            return user.notice('!wolfram <query>');
        }
        wolfram(text, function (error, result) {
            if (!error) {
                if (result.value) {
                    var str = result.title + ': ' + result.value;
                    if (result.image) {
                        str += '(' + result.image + ')';
                    }
                    channel.say(user.getNick() + ': ' + str);
                } else {
                    channel.say(user.getNick() + ': No primary result.');
                }
            } else {
                GLaDOS.logger.error('[wolfram] %s', error);
                channel.say(user.getNick() + ': ' + error);
            }
        });
    });
});

