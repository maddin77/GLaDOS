var request = require('request');
var BitcoinPlugin = function() {};
BitcoinPlugin.prototype.getBitoinData = function(callback) {
    request("http://data.mtgox.com/api/2/BTCEUR/money/ticker", function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var bitcoin = JSON.parse(body);
            if(bitcoin.result == "success") {
                callback(true, parseFloat(bitcoin.data.buy.value.toString()), parseFloat(bitcoin.data.sell.value.toString()));
            }
            else {
               callback(false, bitcoin.error, bitcoin.error);
            }
        }
        else {
            callback(false, error, response.statusCode);
        }
    });
};
BitcoinPlugin.prototype.onCommand = function(server, channel, cmdName, params, user, msg, text) {
    if(cmdName == "bitcoin" || cmdName == "btc") {
        this.getBitoinData(function(success, buy, sell) {
            if(success) {
                var val = 1.0;
                if(params.length > 0) {
                    val = params[0].toString().replace(/\,/g, '.');
                    if(!isNaN(val)) {
                        val = parseFloat(val);
                    }
                    else val = 1.0;
                }
                channel.say(user.getNick() + ": Buy: " + (buy*val) + "€/" + val + "BTC, Sell: " + (sell*val) + "€/" + val + "BTC (data from www.mtgox.com)");
            }
            else {
                user.sendNotice(sell + ": " + buy);
            }
        });
        return true;
    }
};
BitcoinPlugin.prototype.onHelp = function(server, user, text) {
    user.say("Find the latest Bitcoin price in €.");
    user.say("Commands: !bitcoin [amount], !btc [amount]");
};
module.exports = new BitcoinPlugin();