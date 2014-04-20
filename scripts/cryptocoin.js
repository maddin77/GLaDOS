'use strict';
var request = require('request');
var _ = require('underscore');
var moment = require('moment');
var debug = require('debug')('GLaDOS:script:cryptocoin');

module.exports = function (irc) {

    moment.lang('precise-en', {
        "relativeTime" : {
            "future" : "in %s",
            "past" : "%s ago",
            "s" : "%d seconds",
            "m" : "a minute",
            "mm" : "%d minutes",
            "h" : "an hour",
            "hh" : "%d hours",
            "d" : "a day",
            "dd" : "%d days",
            "M" : "a month",
            "MM" : "%d months",
            "y" : "a year",
            "yy" : "%d years"
        }
    });
    moment.lang('precise-en');

    var getCoinData = function (coinName, fn) {
        request({
            "uri": 'http://coinmarketcap.northpole.ro/api/usd/all.json',
            "json": true,
            "headers": {
                "User-Agent": irc.config.userAgent
            }
        }, function (error, response, data) {
            if (!error && response.statusCode === 200) {
                var coin = _.find(data.markets, function (c) {
                    return c.name.toLowerCase() === coinName.toLowerCase() || c.id.toLowerCase() === coinName.toLowerCase();
                });
                if (!_.isUndefined(coin)) {
                    fn(null, coin);
                } else {
                    fn('Unknown coin "' + coinName + '".', null);
                }
            } else {
                fn('Gratz. You broke it. (' + error + ')', null);
                debug('[coindata] %s', error);
            }
        });
    };
    irc.command(['crypto'], function (event) {
        if (event.params.length > 0) {
            getCoinData(event.text, function (error, coin) {
                if (!error) {
                    var str = coin.name + '.';

                    if (coin.marketCap === '?') {
                        str += ' Market Cap: Unknown.';
                    } else {
                        str += ' Market Cap: $ ' + coin.marketCap + '.';
                    }

                    if (coin.price.length === 0) {
                        str += ' Price: Unknown.';
                    } else {
                        str += ' Price: $ ' + coin.price + '.';
                    }

                    if (coin.totalSupply[0] === '?') {
                        str += ' Total Supply: Unknwon.';
                    } else {
                        str += ' Total Supply: ' + coin.totalSupply + '.';
                    }

                    if (coin.volume24.length === 0) {
                        str += ' Volume (24h): Unknwon.';
                    } else {
                        str += ' Volume (24h): $ ' + coin.volume24 + ' (' + coin.change24 + ').';
                    }

                    str += ' Last Update: ' + moment.duration(moment.unix(coin.timestamp).diff(moment()), 'milliseconds').humanize() + ' ago.';

                    event.channel.reply(event.user, str);
                } else {
                    event.channel.reply(event.user, error);
                }
            });
        } else {
            event.user.notice('Use: !crypto <coin>');
        }
    });
    irc.command(['btc', 'bitcoin'], function (event) {
        var currency, quantity, param;
        if (event.params.length === 0) {
            currency = 'EUR';
            quantity = 1.0;
        } else if (event.params.length === 1) {
            param = event.params[0].toString().replace(/\,/g, '.');
            if (isNaN(param)) {
                currency = param.toUpperCase();
                quantity = 1.0;
            } else {
                currency = 'EUR';
                quantity = parseFloat(param);
            }
        } else if (event.params.length === 2) {
            param = event.params[0].toString().replace(/\,/g, '.');
            if (isNaN(param)) {
                currency = param.toUpperCase();
                quantity = parseFloat(event.params[1].toString().replace(/\,/g, '.'));
            } else {
                currency = event.params[1].toUpperCase();
                quantity = parseFloat(param);
            }
        }
        request({
            "uri": 'https://blockchain.info/ticker',
            "json": true,
            "headers": {
                "User-Agent": irc.config.userAgent
            }
        }, function (error, response, data) {
            if (!error && response.statusCode === 200) {
                if (data.hasOwnProperty(currency)) {
                    event.channel.reply(event.user, 'Buy: ' + (data[currency].buy * quantity) + data[currency].symbol + ', Sell: ' + (data[currency].sell * quantity) + data[currency].symbol);
                } else {
                    event.channel.reply(event.user, 'Unknown currency "' + currency + '".');
                }
            } else {
                event.channel.reply(event.user, 'Gratz. You broke it. (' + error + ')');
                debug('[bitcoin] %s', error);
            }
        });
    });
    irc.command(['doge', 'dogecoin'], function (event) {
        var quantity = 1.0;
        if (event.params.length > 0) {
            quantity = parseFloat(event.params[0].toString().replace(/\,/g, '.'));
        }
        request({
            "uri": 'https://www.dogeapi.com/wow/?a=get_current_price&convert_to=USD&amount_doge=' + quantity,
            "headers": {
                "User-Agent": irc.config.userAgent
            }
        }, function (error, response, body) {
            if (!error && response.statusCode === 200) {
                event.channel.reply(event.user, body + '$ / ' + quantity + 'Ð');
            } else {
                event.channel.reply(event.user, 'Gratz. You broke it. (' + error + ')');
                debug('[dogecoin] %s', error);
            }
        });
    });
};