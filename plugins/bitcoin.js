/*global GLaDOS */
'use strict';
var request = require('request');

function getBitoinData(currency, volume, callback) {
    request('https://data.mtgox.com/api/2/BTC' + currency + '/money/ticker_fast', function (error, response, body) {
        if (!error && response.statusCode === 200) {
            var bitcoin = JSON.parse(body), buy, sell;
            if (bitcoin.result === 'success') {
                buy = {
                    'val': bitcoin.data.buy.display.toString(),
                    'str': bitcoin.data.buy.display.toString().replace(/\,/g, '.').replace(/[+-]?\d+\.\d+/g, parseFloat(bitcoin.data.buy.value.toString()) * volume)
                };
                sell = {
                    'val': bitcoin.data.sell.display.toString(),
                    'str': bitcoin.data.sell.display.toString().replace(/\,/g, '.').replace(/[+-]?\d+\.\d+/g, parseFloat(bitcoin.data.sell.value.toString()) * volume)
                };
                callback(null, buy, sell);
            } else {
                if (bitcoin.error === 'This API requires a currency/item context' || bitcoin.error === 'Chosen API not found') {
                    callback(new Error('Unknown currency "' + currency + '"'));
                } else {
                    callback(new Error(bitcoin.error));
                }
            }
        } else {
            GLaDOS.logger.error('[bitcoin] %s', (error || 'Unknown Error'), error);
            return callback(new Error(error || 'Unknown Error'));
        }
    });
}

GLaDOS.register({
    'name': 'bitcoin',
    'description': [
        'Find the latest Bitcoin price in specified currency.',
        'Data from mtgox.com.'
    ],
    'commands': [
        '!bitcoin - Get the latest Bitcoin price in €/1 BTC.',
        '!bitcoin <volume> - Get the latest Bitcoin price in €/<volume> BTC.',
        '!bitcoin <currency> - Get the latest Bitcoin price in <currency>/1 BTC.',
        '!bitcoin <volume> <currency> - Get the latest Bitcoin price in <currency>/<volume> BTC.',
        '!bitcoin <currency> <volume> - Get the latest Bitcoin price in <currency>/<volume> BTC.'
    ]
}, function (ircEvent, command) {
    command(['bitcoin', 'btc'], function (channel, user, name, text, params) {
        var currency = 'EUR',
            volume = 1.0;
        if (params.length === 2) {
            params[1] = params[1].toString().replace(/\,/g, '.');
            params[0] = params[0].toString().replace(/\,/g, '.');
            currency = isNaN(params[0]) ? params[0].toUpperCase() : isNaN(params[1]) ? params[1].toUpperCase() : currency;
            volume = !isNaN(params[0]) ? parseFloat(params[0]) : !isNaN(params[1]) ? parseFloat(params[1]) : volume;
        } else if (params.length === 1) {
            params[0] = params[0].toString().replace(/\,/g, '.');
            if (isNaN(params[0])) {
                currency = params[0].toUpperCase();
            } else {
                volume = parseFloat(params[0]);
            }
        }
        getBitoinData(currency, volume, function (error, buy, sell) {
            if (!error) {
                if (volume === 1.0) {
                    channel.say(user.getNick() + ': buy: ' + buy.str + '/BTC, sell: ' + sell.str + '/BTC');
                } else {
                    channel.say(user.getNick() + ': buy: ' + buy.str + ' (' + buy.val + '/BTC), sell: ' + sell.str + ' (' + sell.val + '/BTC)');
                }
            } else {
                channel.say(user.getNick() + ': ' + error);
            }
        });
    });
});