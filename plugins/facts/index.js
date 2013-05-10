module.exports = {
    /*==========[ +INFO+ ]==========*/
    info: {
        description: "Postet zufällige Fakten im Channel.",
        commands: ["{C}randomfact", "{C}fact", "{N} fact", "{N} fakt", "{N} facts", "{N} fakten"]
    },
    /*==========[ -INFO- ]==========*/

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
    }
};