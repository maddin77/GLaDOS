module.exports = {
    onCommand: function(client, server, channel, commandChar, name, params, user, text, message) {
        if(name == "fact" || name == "randomfact") {
            REQUEST("https://api.twitter.com/1/statuses/user_timeline.json?screen_name=FaktenTweet&count=9999", function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    var tweets = JSON.parse(body);
                    var fact = tweets[Math.floor(Math.random()*tweets.length)].text;
                    client.say(channel.getName(), user.getNick() + ": " + fact);
                }
            });
            return true;
        }
    },
    onResponseMessage: function(client, server, channel, user, message) {
        message.rmatch("^(fact|fakt|facts|fakten)", function(match) {
            REQUEST("https://api.twitter.com/1/statuses/user_timeline.json?screen_name=FaktenTweet&count=9999", function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    var tweets = JSON.parse(body);
                    var fact = tweets[Math.floor(Math.random()*tweets.length)].text;
                    client.say(channel.getName(), user.getNick() + ": " + fact);
                }
            });
        });
    },
    onHelpRequest: function(client, server, user, message, parts) {
        client.say(user.getNick(), "# Beschreibung:");
        client.say(user.getNick(), "#   Postet zufällige Fakten im Channel.");
        client.say(user.getNick(), "# Verwendung:");
        client.say(user.getNick(), "#   !randomfact");
        client.say(user.getNick(), "#   !fact");
        client.say(user.getNick(), "#   " + CONFIG.get('irc:nick') + " fact");
        client.say(user.getNick(), "#   " + CONFIG.get('irc:nick') + " fakt");
        client.say(user.getNick(), "#   " + CONFIG.get('irc:nick') + " facts");
        client.say(user.getNick(), "#   " + CONFIG.get('irc:nick') + " fakten");
    }
};