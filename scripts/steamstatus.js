'use strict';
var request = require('request');
var util = require('util');
var moment = require('moment');
var debug = require('debug')('GLaDOS:script:steamstatus');

module.exports = function (irc) {

    var formatColor, formatTime;

    formatColor = function (service) {
        var color = 'LR';
        if (service.status === 'good') {
            color = 'LG';
        } else if (service.status === 'minor') {
            color = 'O';
        }
        return '{' + color + '}' + (service.title || service.status) + '{R}';
    };

    formatTime = function (timestmap) {
        var a = Date.now() - 1E3 * timestmap;
        return (6E4 > a ? "just now" : 36E5 > a ? Math.round(a / 6E4) + "m" : 864E5 > a ? Math.round(a / 36E5) + "h" : 2592E6 > a ? "\u2248" + Math.round(a / 864E5) + "d" : 31536E6 > a ? "\u2248" + Math.round(a / 2592E6) + "m" : "\u2248" + Math.round(a / 31536E6) + "y");
    };

    irc.command(['steam', 'steamstatus'], function (event) {
        request({
            "uri": 'http://steamstat.us/status.json',
            "json": true,
            "headers": {
                "User-Agent": irc.config.userAgent
            }
        }, function (error, response, data) {
            if (!error && response.statusCode === 200) {
                event.channel.reply(event.user, irc.clrs(util.format('{B}Client{R}: %s (%s), {B}Store{R}: %s (%s), {B}Community{R}: %s (%s), {B}TF2{R}: %s (%s), {B}Dota 2{R}: %s (%s), {B}CS:GO{R}: %s (%s), {B}CS:GO Community{R}: %s',
                    formatColor(data.services.steam), formatTime(data.services.steam.time),
                    formatColor(data.services.store), formatTime(data.services.store.time),
                    formatColor(data.services.community), formatTime(data.services.community.time),
                    formatColor(data.services.tf2), formatTime(data.services.tf2.time),
                    formatColor(data.services.dota2), formatTime(data.services.dota2.time),
                    formatColor(data.services.csgo), formatTime(data.services.csgo.time),
                    formatColor(data.services.csgo_community)
                    )));
            } else {
                event.channel.reply(event.user, 'Gratz. You broke it. (' + error + ')');
                debug('%s', error);
            }
        });
    });
};