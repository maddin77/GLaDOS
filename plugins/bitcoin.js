/*global GLaDOS */
'use strict';
var async = require('async');
var request = require('request');

function getCoinbaseData(quantity, currency, cb) {
    async.parallel([
        function (callback) {
            request({
                uri: 'https://coinbase.com/api/v1/prices/buy?&currency=' + currency,
                json: true
            }, function (error, response, data) {
                if (!error && response.statusCode === 200) {
                    callback(null, parseFloat(data.subtotal.amount), data.subtotal.currency);
                } else {
                    GLaDOS.logger.error('[bitcoin/buy] %s', (error || 'Unknown Error'), error);
                    callback(new Error(error || 'Unknown Error'), null, null);
                }
            });
        },
        function (callback) {
            request({
                uri: 'https://coinbase.com/api/v1/prices/sell?&currency=' + currency,
                json: true
            }, function (error, response, data) {
                if (!error && response.statusCode === 200) {
                    callback(null, parseFloat(data.subtotal.amount), data.subtotal.currency);
                } else {
                    GLaDOS.logger.error('[bitcoin/sell] %s', (error || 'Unknown Error'), error);
                    callback(new Error(error || 'Unknown Error'), null, null);
                }
            });
        }
    ], function (err, results) {
        if (err) {
            cb(err, null, null);
        } else {
            cb(null, {
                'single': results[0][0],
                'quant': results[0][0] * quantity
            }, {
                'single': results[1][0],
                'quant': results[1][0] * quantity
            }, results[0][1]);
        }
    });
}
function getMTGOXData(quantity, currency, cb) {
    request({
        uri: 'https://data.mtgox.com/api/2/BTC' + currency + '/money/ticker_fast',
        json: true
    }, function (error, response, bitcoin) {
        if (!error && response.statusCode === 200) {
            if (bitcoin.result === 'success') {
                var singleBuy = parseFloat(bitcoin.data.buy.value),
                    sungleSell = parseFloat(bitcoin.data.sell.value);
                cb(null, {
                    'single': singleBuy,
                    'quant': singleBuy * quantity
                }, {
                    'single': sungleSell,
                    'quant': sungleSell * quantity
                }, bitcoin.data.buy.currency);
            } else {
                if (bitcoin.error === 'This API requires a currency/item context' || bitcoin.error === 'Chosen API not found') {
                    cb(new Error('Unknown currency "' + currency + '"'));
                } else {
                    cb(new Error(bitcoin.error));
                }
            }
        } else {
            GLaDOS.logger.error('[bitcoin] %s', (error || 'Unknown Error'), error);
            return cb(new Error(error || 'Unknown Error'));
        }
    });
}
function getCurrencySymbol(currency) {
    switch (currency) {
    case 'AUD':
    case 'CAD':
    case 'USD':
        return '$';
    case 'EUR':
        return '€';
    case 'GBP':
        return '£';
    case 'PLN':
        return 'zł';
    case 'RUB':
        return 'р.';
    case 'SEK':
        return 'kr';
    case 'JPY':
    case 'CNY':
        return '¥';
    case 'KRW':
        return '₩';
    case 'DKK':
        return 'kr.';
    case 'THB':
        return '฿';
    default:
        return currency;
    }
}
function getBitoinData(market, quantity, currency, cb) {
    if (market === 'mtgox') {
        getMTGOXData(quantity, currency, cb);
    } else if (market === 'coinbase') {
        getCoinbaseData(quantity, currency, cb);
    }
}

GLaDOS.register({
    'name': 'bitcoin',
    'description': [
        'Tells you the total amount you can get if you sell some bitcoin, and the total price to buy some amount of bitcoin.',
        'The default currency is USD. Right now this is the only currency allowed.',
        'The default quantity is 1.0 BTC.',
        'Data from coinbase.com.'
    ],
    'commands': [
        '!bitcoin',
        '!bitcoin <quantity>',
        '!bitcoin <currency>',
        '!bitcoin <quantity> <currency>',
        '!bitcoin <currency> <quantity>'
    ]
}, function (ircEvent, command) {
    command(['bitcoin', 'btc'], function (channel, user, name, text, params) {
        var currency = 'USD',
            quantity = 1.0;
        if (params.length === 2) {
            params[1] = params[1].toString().replace(/\,/g, '.');
            params[0] = params[0].toString().replace(/\,/g, '.');
            currency = isNaN(params[0]) ? params[0].toUpperCase() : isNaN(params[1]) ? params[1].toUpperCase() : currency;
            quantity = !isNaN(params[0]) ? parseFloat(params[0]) : !isNaN(params[1]) ? parseFloat(params[1]) : quantity;
        } else if (params.length === 1) {
            params[0] = params[0].toString().replace(/\,/g, '.');
            if (isNaN(params[0])) {
                currency = params[0].toUpperCase();
            } else {
                quantity = parseFloat(params[0]);
            }
        }
        getBitoinData('coinbase', quantity, currency, function (error, buy, sell, cur) {
            if (!error) {
                cur = getCurrencySymbol(cur);
                if (quantity === 1.0) {
                    channel.say(user.getNick() + ': buy: ' + buy.single + cur + '/BTC, sell: ' + sell.single + cur + '/BTC');
                } else {
                    channel.say(user.getNick() + ': buy: ' + buy.quant + cur + ' (' + buy.single + cur + '/BTC), sell: ' + sell.quant + cur + ' (' + sell.single + cur + '/BTC)');
                }
            } else {
                channel.say(user.getNick() + ': ' + error);
            }
        });
    });
});