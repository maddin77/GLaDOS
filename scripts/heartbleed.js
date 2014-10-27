var request = require('request');

module.exports = function (scriptLoader) {
    scriptLoader.on('command', 'heartbleed', function (event) {
        if (event.params.length > 0) {
            request({
                'uri': 'https://hbelb.filippo.io/bleed/' + encodeURIComponent(event.text),
                'headers': {
                    'User-Agent': scriptLoader.connection.config.userAgent
                },
                'json': true
            }, function (error, response, data) {
                if (!error && response.statusCode === 200) {
                    if (data.error) {
                        event.channel.reply(event.user, data.error);
                    } else {
                        if (data.code === 0) {
                            event.channel.reply(event.user, data.host + ' IS VULNERABLE.');
                        } else {
                            event.channel.reply(event.user, 'All good, ' + data.host + ' seems fixed or unaffected!');
                        }
                    }
                } else {
                    event.channel.reply(event.user, 'Gratz. You broke it. (' + error + ')');
                    scriptLoader.debug('%s', error);
                }
            });
        } else {
            event.user.notice('Use: !heartbleed <URL or hostname>');
        }
    });
};