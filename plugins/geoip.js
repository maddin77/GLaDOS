var request = require('request');
var _       = require('lodash');

exports.register = function (glados, next) {

    glados.hear(/^!geo( .+)?$/i, function (match, event) {
        var target = match[1] ? match[1].trim() : null;
        if (!target) {
            return event.user.notice('Benutze: !geo <Domain/IP>');
        }
        return request({
            'uri': 'http://ip-api.com/json/' + target,
            'json': true,
            'headers': {
                'User-Agent': glados.config.object.userAgent
            }
        }, function (error, response, data) {
            if (!error && response.statusCode === 200) {
                if (data.status === 'success') {
                    var values = [];
                    _.each(data, function (value, key) {
                        if (value.length > 0 && key !== 'query' && key !== 'status' && key !== 'countryCode' && key !== 'region' && key !== 'zip' && key !== 'lat' && key !== 'lon' && key !== 'timezone') {
                            values.push(value);
                        }
                    });
                    event.channel.reply(event.user, target + ' löst nach ' + data.query + ' auf (' + values.join(', ') + ')');
                } else {
                    if (data.message === 'private range') {
                        event.channel.reply(event.user, 'Die IP Adresse gehört zu einem privaten Adressbereich (' + data.query + ')');
                    } else if (data.message === 'reserved range') {
                        event.channel.reply(event.user, 'Die IP Adresse gehört zu einem reservierten Adressbereich (' + data.query + ')');
                    } else if (data.message === 'invalid query') {
                        event.channel.reply(event.user, 'Ungültige IP Adresse oder Domainname (' + data.query + ')');
                    } else {
                        event.channel.reply(event.user, data.message + ' (' + data.query + ')');
                    }
                }
            } else {
                event.channel.reply(event.user, 'Gratz. You broke it. (' + error + ')');
                glados.debug('[geo] %s', error);
            }
        });
    });


    return next();
};
exports.info = {
    name: 'geoip',
    displayName: 'Geo IP Tool',
    desc: ['Geo Informationen via Befehl.'],
    version: '1.0.0',
    commands: [{
        name: 'geo',
        params: {
            'Domain oder IP': 'required'
        },
        desc: ['Gibt Geo Informationen zu der angegebenen Domain bzw. IP Adresse zurück.']
    }]
};