'use strict';
var request = require('request');
var debug = require('debug')('GLaDOS:script:weather');

module.exports = function (irc) {
    irc.command(['w', 'weather'], function (event) {
        if (event.params.length > 0) {
            request({
                "uri": 'http://api.openweathermap.org/data/2.1/find/name?q=' + encodeURIComponent(event.text) + '&units=metric',
                "json": true,
                "headers": {
                    "User-Agent": irc.config.userAgent
                }
            }, function (error, response, data) {
                if (!error && response.statusCode === 200) {
                    if (data.cod === "200") {
                        var entry = data.list[0],
                            country = entry.sys.country,
                            desc = entry.weather[0].description,
                            cName = entry.name,
                            temp = 'Temperature: ' + entry.main.temp + '°C (' + entry.main.temp_min + '°C - ' + entry.main.temp_max + '°C). ',
                            wind = entry.wind.speed ? ('Wind: ' + entry.wind.speed + 'm/s. ') : '',
                            clouds = entry.clouds.all ? ('Clouds: ' + entry.clouds.all + '%. ') : '',
                            humidity = entry.main.humidity ? ('Humidity: ' + entry.main.humidity + '%. ') : '',
                            hpa = entry.main.pressure ? ('Atmospheric pressure: ' + entry.main.pressure + ' hPa. ') : '';
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