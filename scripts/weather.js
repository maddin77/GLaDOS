'use strict';
var request = require('request');
var debug = require('debug')('GLaDOS:script:weather');

module.exports = function (scriptLoader, irc) {
    scriptLoader.registerCommand(['w', 'weather'], function (event) {
        if (event.params.length > 0) {
            request({
                "uri": 'http://api.openweathermap.org/data/2.5/weather?q=' + encodeURIComponent(event.text) + '&units=metric',
                "json": true,
                "headers": {
                    "User-Agent": irc.config.userAgent
                }
            }, function (error, response, data) {
                if (!error && response.statusCode === 200) {
                    if (data.cod === 200) {
                        var country = data.sys.country,
                            desc = data.weather[0].description,
                            cName = data.name,
                            temp = 'Temperature: ' + data.main.temp + '°C (' + data.main.temp_min + '°C - ' + data.main.temp_max + '°C). ',
                            wind = data.wind.speed ? ('Wind: ' + data.wind.speed + 'm/s. ') : '',
                            clouds = data.clouds.all ? ('Clouds: ' + data.clouds.all + '%. ') : '',
                            humidity = data.main.humidity ? ('Humidity: ' + data.main.humidity + '%. ') : '',
                            hpa = data.main.pressure ? ('Atmospheric pressure: ' + data.main.pressure + ' hPa. ') : '';
                        event.channel.reply(event.user, cName + ' (' + country + '): ' + desc + '. ' + temp + wind + clouds + humidity + hpa);
                    } else {
                        event.channel.reply(event.user, data.message);
                    }
                } else {
                    event.channel.reply(event.user, 'Gratz. You broke it. (' + error + ')');
                    debug('%s', error);
                }
            });
        } else {
            event.user.notice('Use: !weather <city>');
        }
    });
};