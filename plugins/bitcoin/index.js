module.exports = {
    getBitoinData: function(callback) {
        REQUEST("http://data.mtgox.com/api/2/BTCEUR/money/ticker", function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var bitcoin = JSON.parse(body);
                if(bitcoin.result == "success") {
                    callback(true, parseFloat(bitcoin.data.buy.value.toString()), parseFloat(bitcoin.data.sell.value.toString()));
                }
                else {
                   callback(false, error, bitcoin.result);
                }
            }
            else {
                callback(false, error, response.statusCode);
            }
        });
    },
    onCommand: function(client, server, channel, commandChar, name, params, user, text, message) {
        if(name == "bitcoin" || name == "btc") {
            this.getBitoinData(function(success, buy, sell) {
                if(success) {
                    if(params.length === 0) {
                        client.say(channel.getName(), user.getNick() + ": Kaufen: " + buy + "€/BTC, Verkaufen: " + sell + "€/BTC (data from www.mtgox.com)");
                    }
                    else {
                        if(!isNaN(params[0])) {
                            client.say(channel.getName(), user.getNick() + ": Kaufen: " + (buy*parseFloat(params[0])) + "€/" + params[0] + ", Verkaufen: " + (sell*parseFloat(params[0])) + "€/" + params[0] + " (data from www.mtgox.com)");
                        }
                    }
                }
                else {
                    client.notice(user.getNick(), sell + ": " + buy);
                }
            });
            return true;
        }
    },
    onResponseMessage: function(client, server, channel, user, message) {
        var that = this;
        message.rmatch("^bitcoin(s)?( kurs)?", function(match) {
            that.getBitoinData(function(success, buy, sell) {
                if(success) {
                    client.say(channel.getName(), user.getNick() + ": Kaufen: " + buy + "€/BTC, Verkaufen: " + sell + "€/BTC (data from www.mtgox.com)");
                }
                else {
                    client.notice(user.getNick(), sell + ": " + buy);
                }
            });
        });
    },
    onHelpRequest: function(client, server, user, message, parts) {
        client.say(user.getNick(), "# Beschreibung:");
        client.say(user.getNick(), "#   Gibt den aktuellen Kurs für Bitcoins in Euro aus oder Berechnet den An- und Verkaufswert für die angegebene Menge an Bitcoins.");
        client.say(user.getNick(), "# Verwendung:");
        client.say(user.getNick(), "#   !bitcoin");
        client.say(user.getNick(), "#   !btc");
        client.say(user.getNick(), "#   !bitcoin <Menge>");
        client.say(user.getNick(), "#   !btc <Menge>");
        client.say(user.getNick(), "#   " + CONFIG.get('irc:nick') + " bitcoin(s)");
        client.say(user.getNick(), "#   " + CONFIG.get('irc:nick') + " bitcoin(s) kurs");
    }
};