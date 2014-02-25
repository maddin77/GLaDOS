/*global GLaDOS */
'use strict';
var request = require('request');
var util = require('util');
GLaDOS.register({
    'name': 'weather',
    'description': 'Get information about the current weather in a specific location.',
    'commands': '!weather <city> - Get information about the current weather in <city>.'
}, function (ircEvent, command) {
    command(['weather', 'w'], function (channel, user, name, text, params) {
        if (params.length === 0) {
            return user.notice('!weather <city>');
        }
        request({
            uri: 'http://api.openweathermap.org/data/2.1/find/name?q=' + encodeURIComponent(text) + '&units=metric',
            json: true
        }, function (error, response, body) {
            if (!error && response.statusCode === 200) {
                if (body.cod === "200") {
                    var entry = body.list[0],
                        country = entry.sys.country,
                        desc = entry.weather[0].description,
                        cName = entry.name,
                        temp = 'Temperature: ' + entry.main.temp + '°C (' + entry.main.temp_min + '°C - ' + entry.main.temp_max + '°C). ',
                        wind = entry.wind.speed ? ('Wind: ' + entry.wind.speed + 'm/s. ') : '',
                        clouds = entry.clouds.all ? ('Clouds: ' + entry.clouds.all + '%. ') : '',
                        humidity = entry.main.humidity ? ('Humidity: ' + entry.main.humidity + '%. ') : '',
                        hpa = entry.main.pressure ? ('Atmospheric pressure: ' + entry.main.pressure + ' hPa. ') : '';
                    channel.say(user.getNick() + ': ' + cName + ' (' + country + '): ' + desc + '. ' + temp + wind + clouds + humidity + hpa);
                } else {
                    channel.say(user.getNick() + ': ' + body.message);
                }
            } else {
                GLaDOS.logger.error('[weather] %s', (error || 'Unknown Error'), error);
                channel.say(user.getNick() + ': ' + (error || 'Unknown Error'));
            }
        });
    });
});