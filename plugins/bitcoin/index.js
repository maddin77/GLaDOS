var request = require('request');
var BitcoinPlugin = function() {};
BitcoinPlugin.prototype.getBitoinData = function(currency, volume, callback) {
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
BitcoinPlugin.prototype.onCommand = function(server, channel, cmdName, params, user, msg, text) {
    if(cmdName == "bitcoin" || cmdName == "btc") {
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
        this.getBitoinData(currency, volume, function(error, buy, sell) {
            if(!error) {
                if(volume == 1) {
                    channel.say(user.getNick() + ': Buy: ' + buy.str + '/BTC, Sell: ' + sell.str + '/BTC');
                }
                else {
                    channel.say(user.getNick() + ': Buy: ' + buy.str + ' (' + buy.val + '/BTC), Sell: ' + sell.str + ' (' + sell.val + '/BTC)');
                }
            }
            else {
                channel.say(user.getNick() + ': ' + error);
            }
        });
        return true;
    }
};
BitcoinPlugin.prototype.onHelp = function(server, user, text) {
    user.say('Find the latest Bitcoin price.');
    user.say('Commands: !bitcoin OR !btc');
    user.say('!bitcoin - Get the latest Bitcoin price in €/1 BTC.');
    user.say('!bitcoin [volume] - Get the latest Bitcoin price in €/[volume] BTC.');
    user.say('!bitcoin [currency] - Get the latest Bitcoin price in [currency]/1 BTC.');
    user.say('!bitcoin [volume] [currency] - Get the latest Bitcoin price in [currency]/[volume] BTC.');
    user.say('!bitcoin [currency] [volume] - Get the latest Bitcoin price in [currency]/[volume] BTC.');
};
module.exports = new BitcoinPlugin();