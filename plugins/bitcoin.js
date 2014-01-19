var request = require('request');
GLaDOS.register({
    'name': 'bitcoin',
    'desc': 'find the latest bitcoin price in specified currency.',
    'commands': [
        '!bitcoin - get the latest bitcoin price in €/1 BTC.',
        '!bitcoin <volume> - get the latest bitcoin price in €/<volume> BTC.',
        '!bitcoin <currency> - get the latest bitcoin price in <currency>/1 BTC.',
        '!bitcoin <volume> <currency> - get the latest bitcoin price in <currency>/<volume> BTC.',
        '!bitcoin <currency> <volume> - get the latest bitcoin price in <currency>/<volume> BTC.'
    ]
}, function(ircEvent, command) {
    command(['bitcoin', 'btc'], function(channel, user, name, text, params) {
        var currency = 'EUR';
        var volume = 1.0;
        if(params.length == 2) {
            params[1] = params[1].toString().replace(/\,/g, '.');
            params[0] = params[0].toString().replace(/\,/g, '.');
            currency = isNaN(params[0]) ? params[0].toUpperCase() : isNaN(params[1]) ? params[1].toUpperCase() : currency;
            volume = !isNaN(params[0]) ? parseFloat(params[0]) : !isNaN(params[1]) ? parseFloat(params[1]) : volume;
        }
        else if(params.length == 1) {
            params[0] = params[0].toString().replace(/\,/g, '.');
            if(isNaN(params[0])) {
                currency = params[0].toUpperCase();
            } else {
                volume = parseFloat(params[0]);
            }
        }
        getBitoinData(currency, volume, function(error, buy, sell) {
            if(!error) {
                if(volume == 1.0) {
                    channel.say(user.getNick() + ': buy: ' + buy.str + '/BTC, sell: ' + sell.str + '/BTC');
                }
                else {
                    channel.say(user.getNick() + ': buy: ' + buy.str + ' (' + buy.val + '/BTC), sell: ' + sell.str + ' (' + sell.val + '/BTC)');
                }
            }
            else {
                channel.say(user.getNick() + ': ' + error);
            }
        });
    });
});
function getBitoinData(currency, volume, callback) {
    request('https://data.mtgox.com/api/2/BTC' + currency + '/money/ticker_fast', function (error, response, body) {
        if (!error) {
            var bitcoin = JSON.parse(body);
            if(bitcoin.result === 'success') {
                var buy = {
                    'val': bitcoin.data.buy.display.toString(),
                    'str': bitcoin.data.buy.display.toString().replace(/\,/g, '.').replace(/[+-]?\d+\.\d+/g, parseFloat(bitcoin.data.buy.value.toString())*volume)
                }
                var sell = {
                    'val': bitcoin.data.sell.display.toString(),
                    'str': bitcoin.data.sell.display.toString().replace(/\,/g, '.').replace(/[+-]?\d+\.\d+/g, parseFloat(bitcoin.data.sell.value.toString())*volume)
                }
                return callback(null, buy, sell);
            }
            else {
                if(bitcoin.error === 'This API requires a currency/item context' || bitcoin.error === 'Chosen API not found') {
                    return callback(new Error('Unknown currency "' + currency + '"'));
                }
                else {
                    return callback(new Error(bitcoin.error));
                }
            }
        }
        else {
            return callback(error||'Unknown Error');
        }
    });
};