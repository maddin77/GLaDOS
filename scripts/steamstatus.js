/*jshint camelcase: false */
var request = require('request');
var ircC    = require('irc-colors');

module.exports = function (scriptLoader) {

    var formatColor, formatTime;

    formatColor = function (service) {
        if (service.status === 'good') {
            return ircC.lime(service.title || service.status);
        }
        if (service.status === 'minor') {
            return ircC.olive(service.title || service.status);
        }
        return ircC.red(service.title || service.status);
    };

    formatTime = function (timestmap) {
        var a = Date.now() - 1E3 * timestmap;
        return (6E4 > a ? 'just now' : 36E5 > a ? Math.round(a / 6E4) + 'm' : 864E5 > a ? Math.round(a / 36E5) + 'h' : 2592E6 > a ? '\u2248' + Math.round(a / 864E5) + 'd' : 31536E6 > a ? '\u2248' + Math.round(a / 2592E6) + 'm' : '\u2248' + Math.round(a / 31536E6) + 'y');
    };

    scriptLoader.on('command', ['steam', 'steamstatus'], function (event) {
        request({
            'uri': 'https://steamdb.info/api/SteamRailgun/',
            'json': true,
            'headers': {
                'User-Agent': scriptLoader.connection.config.userAgent
            }
        }, function (error, response, data) {
            if (!error && response.statusCode === 200) {
                event.channel.say('%s: %s (%s), %s: %s (%s), %s: %s (%s), %s: %s (%s), %s: %s (%s), %s: %s (%s), %s: %s',
                    ircC.bold('Client'), formatColor(data.services.steam), formatTime(data.services.steam.time),
                    ircC.bold('Store'), formatColor(data.services.store), formatTime(data.services.store.time),
                    ircC.bold('Community'), formatColor(data.services.community), formatTime(data.services.community.time),
                    ircC.bold('TF2'), formatColor(data.services.tf2), formatTime(data.services.tf2.time),
                    ircC.bold('Dota 2'), formatColor(data.services.dota2), formatTime(data.services.dota2.time),
                    ircC.bold('CS:GO'), formatColor(data.services.csgo), formatTime(data.services.csgo.time),
                    ircC.bold('CS:GO Community'), formatColor(data.services.csgo_community)
                    );
            } else {
                event.channel.reply(event.user, 'Gratz. You broke it. (' + error + ')');
                scriptLoader.debug('%s', error);
            }
        });
    });
};
