/*jshint camelcase: false */
var request = require('request');

exports.register = function (glados, next) {
    glados.hear(/^!(?:weather|wetter|w)( .+)?$/i, function (match, event) {
        var city = match[1] ? match[1].trim() : null;
        if (!city) {
            return event.user.notice('Benutze: !wetter <Stadt>');
        }
        request({
            'uri': 'http://api.openweathermap.org/data/2.5/weather?q=' + encodeURIComponent(city) + '&units=metric',
            'json': true,
            'headers': {
                'User-Agent': glados.config.object.userAgent
            }
        }, function (error, response, data) {
            if (!error && response.statusCode === 200) {
                if (data.cod === 200) {
                    var country = data.sys.country,
                        desc = data.weather[0].description,
                        cName = data.name,
                        temp = 'Temperatur: ' + data.main.temp + '°C (' + data.main.temp_min + '°C - ' + data.main.temp_max + '°C). ',
                        wind = data.wind.speed ? ('Wind: ' + data.wind.speed + 'm/s. ') : '',
                        clouds = data.clouds.all ? ('Wolken: ' + data.clouds.all + '%. ') : '',
                        humidity = data.main.humidity ? ('Luftfeuchtigkeit: ' + data.main.humidity + '%. ') : '',
                        hpa = data.main.pressure ? ('Atmosphärendruck: ' + data.main.pressure + ' hPa. ') : '';
                    event.channel.reply(event.user, cName + ' (' + country + '): ' + desc + '. ' + temp + wind + clouds + humidity + hpa);
                } else {
                    event.channel.reply(event.user, data.message);
                }
            } else {
                event.channel.reply(event.user, 'Gratz. You broke it. (' + error + ')');
                glados.debug('%s', error);
            }
        });
    });

    return next();
};
exports.info = {
    name: 'weather',
    displayName: 'Wetter',
    desc: ['Wettervorhersagen.'],
    version: '1.0.0',
    commands: [{
        name: 'weather',
        alias: ['w'],
        params: {
            'Stadt': 'required'
        },
        desc: ['Gibt aktuelle Wetterinformationen für die aktuelle Stadt zurück.']
    }]
};