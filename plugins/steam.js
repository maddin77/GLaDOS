/*jshint camelcase: false */
var request = require('request');
var ircC    = require('irc-colors');

exports.register = function (glados, next) {

    var formatColor = function (service) {
        if (service.status === 'good') {
            return ircC.lime(service.title || service.status);
        }
        if (service.status === 'minor') {
            return ircC.olive(service.title || service.status);
        }
        return ircC.red(service.title || service.status);
    };

    var formatTime = function (timestmap) {
        var a = Date.now() - 1E3 * timestmap;
        return (6E4 > a ? 'just now' : 36E5 > a ? Math.round(a / 6E4) + 'm' : 864E5 > a ? Math.round(a / 36E5) + 'h' : 2592E6 > a ? '\u2248' + Math.round(a / 864E5) + 'd' : 31536E6 > a ? '\u2248' + Math.round(a / 2592E6) + 'm' : '\u2248' + Math.round(a / 31536E6) + 'y');
    };

    glados.hear(/^!steam$/i, function (match, event) {
        request({
            'uri': 'https://steamdb.info/api/SteamRailgun/',
            'json': true,
            'headers': {
                'User-Agent': glados.config.object.userAgent
            }
        }, function (error, response, data) {
            if (!error && response.statusCode === 200) {
                event.channel.say('%s: %s (%s), %s: %s (%s), %s: %s (%s), %s: %s (%s), %s: %s (%s), %s: %s (%s), %s: %s',
                    ircC.bold('Client'), formatColor(data.services.steam), formatTime(data.services.steam.time),
                    ircC.bold('Shop'), formatColor(data.services.store), formatTime(data.services.store.time),
                    ircC.bold('Community'), formatColor(data.services.community), formatTime(data.services.community.time),
                    ircC.bold('TF2'), formatColor(data.services.tf2), formatTime(data.services.tf2.time),
                    ircC.bold('Dota 2'), formatColor(data.services.dota2), formatTime(data.services.dota2.time),
                    ircC.bold('CS:GO'), formatColor(data.services.csgo), formatTime(data.services.csgo.time),
                    ircC.bold('CS:GO Community'), formatColor(data.services.csgo_community)
                    );
            } else {
                event.channel.reply(event.user, 'Gratz. You broke it. (' + error + ')');
                glados.debug('%s', error);
            }
        });
    });
    glados.hear(/^!steam:server$/i, function (match, event) {
        request({
            'uri': 'https://steamdb.info/api/SteamRailgun/',
            'json': true,
            'headers': {
                'User-Agent': glados.config.object.userAgent
            }
        }, function (error, response, data) {
            if (!error && response.statusCode === 200) {
                event.channel.say('%s: %s, %s: %s, %s: %s, %s: %s, %s: %s, %s: %s',
                    ircC.bold('Australien'), formatColor(data.services['cm-AU']),
                    ircC.bold('China'), formatColor(data.services['cm-CN']),
                    ircC.bold('Europa'), formatColor(data.services['cm-EU']),
                    ircC.bold('Niederlande'), formatColor(data.services['cm-NL']),
                    ircC.bold('Singapur'), formatColor(data.services['cm-SG']),
                    ircC.bold('Vereinigte Staaten'), formatColor(data.services['cm-US'])
                );
            } else {
                event.channel.reply(event.user, 'Gratz. You broke it. (' + error + ')');
                glados.debug('%s', error);
            }
        });
    });
    glados.hear(/^!csgo$/i, function (match, event) {
        request({
            'uri': 'https://steamdb.info/api/SteamRailgun/',
            'json': true,
            'headers': {
                'User-Agent': glados.config.object.userAgent
            }
        }, function (error, response, data) {
            if (!error && response.statusCode === 200) {
                event.channel.say('%s: %s (%s), %s: %s, %s: %s, %s: %s, %s: %s, %s: %s',
                    ircC.bold('CS:GO'), formatColor(data.services.csgo), formatTime(data.services.csgo.time),
                    ircC.bold('Community'), formatColor(data.services.csgo_community),
                    ircC.bold('Sessions Logon'), formatColor(data.services.csgo_sessions),
                    ircC.bold('Matchmaking Planer'), formatColor(data.services.csgo_mm_scheduler),
                    ircC.bold('Spieler suchend'), formatColor(data.services.csgo_mm_searching),
                    ircC.bold('Durchschnittliche Wartezeit'), formatColor(data.services.csgo_mm_average)
                );
            } else {
                event.channel.reply(event.user, 'Gratz. You broke it. (' + error + ')');
                glados.debug('%s', error);
            }
        });
    });
    glados.hear(/^!csgo:server$/i, function (match, event) {
        request({
            'uri': 'https://steamdb.info/api/SteamRailgun/',
            'json': true,
            'headers': {
                'User-Agent': glados.config.object.userAgent
            }
        }, function (error, response, data) {
            if (!error && response.statusCode === 200) {
                event.channel.say('%s: %s, %s: %s, %s: %s, %s: %s, %s: %s, %s: %s, %s: %s, %s: %s, %s: %s, %s: %s, %s: %s',
                    ircC.bold('Osteuropa'), formatColor(data.services.csgo_eu_east),
                    ircC.bold('Nordeuropa'), formatColor(data.services.csgo_eu_north),
                    ircC.bold('Westeuropa'), formatColor(data.services.csgo_eu_west),
                    ircC.bold('US Ostküste'), formatColor(data.services.csgo_us_northeast),
                    ircC.bold('US Westküste'), formatColor(data.services.csgo_us_northwest),
                    ircC.bold('Australien'), formatColor(data.services.csgo_australia),
                    ircC.bold('Brasilien'), formatColor(data.services.csgo_brazil),
                    ircC.bold('Arabische Emirate'), formatColor(data.services.csgo_emirates),
                    ircC.bold('Indien'), formatColor(data.services.csgo_india),
                    ircC.bold('Singapur'), formatColor(data.services.csgo_singapore),
                    ircC.bold('Südafrika'), formatColor(data.services.csgo_southafrica)
                );
            } else {
                event.channel.reply(event.user, 'Gratz. You broke it. (' + error + ')');
                glados.debug('%s', error);
            }
        });
    });

    return next();
};
exports.info = {
    name: 'steam',
    displayName: 'Steam',
    desc: ['Informationen zu Steam und co.'],
    version: '1.0.0',
    commands: [{
        name: 'steam',
        desc: ['Gibt den aktuellen Status der Steam Plattform (Shop, Community, Client, usw.) zurück.']
    },{
        name: 'steam:server',
        desc: ['Gibt den aktuellen Status der Steam Server zurück.']
    },{
        name: 'csgo',
        desc: ['Gibt den aktuellen Status der CS:GO Plattform (Matchmaking, Durchschnittliche Wartezeit, usw.) zurück.']
    },{
        name: 'steam:server',
        desc: ['Gibt den aktuellen Status der CS:GO Server zurück.']
    }]
};