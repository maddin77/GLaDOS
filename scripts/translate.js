var request = require('request');

module.exports = function (scriptLoader) {
    scriptLoader.on('command', ['t', 'translate'], function (event) {
        if (event.params.length > 2) {
            var source = event.params[0],
                target = event.params[1],
                sentence = event.text.substring(source.length + target.length + 2);
            request({
                'uri': 'http://api.mymemory.translated.net/get?q=' + encodeURIComponent(sentence) + '&langpair=' + source + '|' + target,
                'json': true,
                'headers': {
                    'User-Agent': scriptLoader.connection.config.userAgent
                }
            }, function (error, response, data) {
                if (!error && response.statusCode === 200) {
                    if (data.responseStatus === 200) {
                        event.channel.reply(event.user, data.responseData.translatedText);
                    } else {
                        event.channel.reply(event.user, data.responseDetails);
                    }
                } else {
                    event.channel.reply(event.user, 'Gratz. You broke it. (' + error + ')');
                    scriptLoader.debug('%s', error);
                }
            });
        } else {
            event.user.notice('Use: !translate <source language> <target language> <sentence>');
        }
    });
};