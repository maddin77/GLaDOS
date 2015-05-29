var request = require('request');
var _       = require('lodash');
var util    = require('util');

exports.register = function (glados, next) {
    var formatMoney = function (money, cur) {
        if (cur === '$') {
            return '$' + money.replace(/\d(?=(\d{3})+\.)/g, '$&,');
        }
        if (cur === '€') {
            return money.replace('.', ',').replace(/\d(?=(\d{3})+\,)/g, '$&.') + '€';
        }
        return money.replace(/\d(?=(\d{3})+\.)/g, '$&,');
    };
    var getCoinData = function (coinName, fn) {
        request({
            'uri': 'http://coinmarketcap.northpole.ro/api/v5/all.json',
            'json': true,
            'headers': {
                'User-Agent': glados.config.object.userAgent
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
                glados.debug('[getCoinData] %s', error);
            }
        });
    };
    var formatReponse = function (coinName, currency, callback) {
        var availableCurrencies = ['usd', 'btc', 'eur', 'cny', 'gbp', 'cad', 'rub', 'hkd'];
        if (!_.contains(availableCurrencies, currency)) {
            return callback(util.format('Unbekannte Währung "%s". Verfügbare Währungen sind: %s', currency, availableCurrencies.join(', ')), null);
        }
        getCoinData(coinName, function (error, coin) {
            if (error) {
                return callback(error, null);
            }
            var marketCap = '', price = '';
            if (currency === 'eur') {
                marketCap = formatMoney(coin.marketCap[currency], '€');
                price = formatMoney(coin.price[currency], '€');
            } else if (currency === 'usd') {
                marketCap = formatMoney(coin.marketCap[currency], '$');
                price = formatMoney(coin.price[currency], '$');
            } else {
                marketCap = formatMoney(coin.marketCap[currency]);
                price = formatMoney(coin.price[currency]);
            }
            callback(null, util.format('%s (%s). Preis: %s. Marktkapitalisierung: %s. Verfügbar: %s %s.', coin.name, coin.symbol, price, marketCap, coin.availableSupply, coin.symbol));
        });
    };
    glados.hear(/^!crypto( \S+)?( \S+)?$/i, function (match, event) {
        var coin = match[1] ? match[1].trim() : null;
        var currency = match[2] ? match[2].trim() : 'eur';
        if (!coin) {
            return event.user.notice('Benutze: !crypto <Coin> [Währung]');
        }
        formatReponse(coin, currency, function (err, message) {
            if (err) {
                event.user.notice(err);
            } else {
                event.channel.say(message);
            }
        });
    });
    glados.hear(/^!(?:bitcoin|btc)( \S+)?$/i, function (match, event) {
        var currency = match[1] ? match[1].trim() : 'eur';
        if (!currency) {
            return event.user.notice('Benutze: !bitcoin [Währung]');
        }
        formatReponse('bitcoin', currency, function (err, message) {
            if (err) {
                event.user.notice(err);
            } else {
                event.channel.say(message);
            }
        });
    });
    glados.hear(/^!(?:dogecoin|doge)( \S+)?$/i, function (match, event) {
        var currency = match[1] ? match[1].trim() : 'eur';
        if (!currency) {
            return event.user.notice('Benutze: !dogecoin [Währung]');
        }
        formatReponse('dogecoin', currency, function (err, message) {
            if (err) {
                event.user.notice(err);
            } else {
                event.channel.say(message);
            }
        });
    });
    return next();
};
exports.info = {
    name: 'cryptocoin',
    displayName: 'Kryptowährungen',
    desc: [
        'Bietet verschiedene Befehle um informationen oder Preise zu Kryptowährungen zu bekommen.',
        'Die Standardwährung bei allen Befehlen ist Euro (eur) und kann optional durch eine der folgenden Währungen ersetzt werden:',
        'US Dollar (usd), Bitcoin (btc), Euro (eur), Yuan (cny), Pfund Sterling (gbp), Kanadischer Dollar (cad), Russischer Rubel (rub), Hongkong-Dollar (hkd), Yen (jpy), Australischer Dollar (aud).',
    ],
    version: '1.0.1',
    commands: [{
        name: 'bitcoin',
        alias: ['btc'],
        params: {
            'Währung': 'optional'
        },
        desc: ['Gibt den aktuellen Kurs der Kryptowährung Bitcoin zurück.']
    },{
        name: 'dogecoin',
        alias: ['doge'],
        params: {
            'Währung': 'optional'
        },
        desc: ['Gibt den aktuellen Kurs der Kryptowährung Dogecoin zurück.']
    },{
        name: 'crypto',
        params: {
            'Coin': 'required',
            'Währung': 'optional'
        },
        desc: ['Gibt den aktuellen Kurs der angegebenen Kryptowährung zurück. Eine vollständige Liste findet man auf coinmarketcap.com']
    }]
};
