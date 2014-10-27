var request = require('request');
var _       = require('underscore');
var moment  = require('moment');
var utils   = require('../lib/utils');
var util    = require('util');

module.exports = function (scriptLoader) {

    moment.locale('precise-en', {
        'relativeTime' : {
            'future' : 'in %s',
            'past' : '%s ago',
            's' : '%d seconds',
            'm' : 'a minute',
            'mm' : '%d minutes',
            'h' : 'an hour',
            'hh' : '%d hours',
            'd' : 'a day',
            'dd' : '%d days',
            'M' : 'a month',
            'MM' : '%d months',
            'y' : 'a year',
            'yy' : '%d years'
        }
    });
    moment.locale('precise-en');

    var getCoinData, formatReponse;

    getCoinData = function (coinName, fn) {
        request({
            'uri': 'http://coinmarketcap.northpole.ro/api/v5/all.json',
            'json': true,
            'headers': {
                'User-Agent': scriptLoader.connection.config.userAgent
            }
        }, function (error, response, data) {
            if (!error && response.statusCode === 200) {
                var coin = _.find(data.markets, function (c) {
                    return c.name.toLowerCase() === coinName.toLowerCase() || c.symbol.toLowerCase() === coinName.toLowerCase();
                });
                if (!_.isUndefined(coin)) {
                    fn(null, coin);
                } else {
                    fn('Unknown coin "' + coinName + '".', null);
                }
            } else {
                fn('Gratz. You broke it. (' + error + ')', null);
                scriptLoader.debug('[coindata] %s', error);
            }
        });
    };

    formatReponse = function (coinName, currency, callback) {
        var availableCurrencies = ['usd', 'btc', 'eur', 'cny', 'gbp', 'cad', 'rub', 'hkd'];
        if (!_.contains(availableCurrencies, currency)) {
            return callback(util.format('Unknwon currency "%s". Available currencies are: %s', currency, availableCurrencies.join(', ')), null);
        }
        getCoinData(coinName, function (error, coin) {
            if (error) {
                return callback(error, null);
            }
            var marketCap = '', price = '';
            if (currency === 'eur') {
                marketCap = utils.formatMoney(coin.marketCap[currency], '€');
            } else if (currency === 'usd') {
                marketCap = utils.formatMoney(coin.marketCap[currency], '$');
            } else {
                marketCap = utils.formatMoney(coin.marketCap[currency]);
            }
            if (currency === 'eur') {
                price = utils.formatMoney(coin.price[currency], '€');
            } else if (currency === 'usd') {
                price = utils.formatMoney(coin.price[currency], '$');
            } else {
                price = utils.formatMoney(coin.price[currency]);
            }
            callback(null, util.format('%s (%s). Price: %s. Market Cap: %s. Available Supply: %s %s.', coin.name, coin.symbol, price, marketCap, coin.availableSupply, coin.symbol));
        });
    };
    scriptLoader.on('command', 'crypto', function (event) {
        if (event.params.length === 0) {
            return event.user.notice('Use: !crypto <coin> [currency]');
        }
        formatReponse(event.params[0], event.params.length > 1 ? event.params[1] : 'eur', function (err, message) {
            if (err) {
                event.user.notice(err);
            } else {
                event.channel.say(message);
            }
        });
    });
    scriptLoader.on('command', ['btc', 'bitcoin'], function (event) {
        formatReponse('bitcoin', event.params.length > 0 ? event.params[0] : 'eur', function (err, message) {
            if (err) {
                event.user.notice(err);
            } else {
                event.channel.say(message);
            }
        });
    });
    scriptLoader.on('command', ['doge', 'dogecoin'], function (event) {
        formatReponse('dogecoin', event.params.length > 0 ? event.params[0] : 'eur', function (err, message) {
            if (err) {
                event.user.notice(err);
            } else {
                event.channel.say(message);
            }
        });
    });
};