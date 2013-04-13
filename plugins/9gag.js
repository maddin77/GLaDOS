module.exports = {
    onCommand: function(client, server, channel, commandChar, name, params, user, text, message) {
        if(name == "9gag") {
            REQUEST("http://9gag.com/random", function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    var $ = CHEERIO.load(body);
                    var src = $(".img-wrap img").attr('src');
                    var img_src = "http:"+src;
                    client.say(channel.getName(), user.getNick() + ": " + img_src);
                }
            });
        }
    },
    onResponseMessage: function(client, server, channel, user, message) {
        message.rmatch("^9gag", function(match) {
            REQUEST("http://9gag.com/random", function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    var $ = CHEERIO.load(body);
                    var src = $(".img-wrap img").attr('src');
                    var img_src = "http:"+src;
                    client.say(channel.getName(), user.getNick() + ": " + img_src);
                }
            });
        });
    },
    onHelpRequest: function(client, server, user, message, parts) {
        client.say(user.getNick(), "# Beschreibung:");
        client.say(user.getNick(), "#   Postet den Link eines zufälligen Bildes von www.9gag.com im Channel.");
        client.say(user.getNick(), "# Verwendung:");
        client.say(user.getNick(), "#   !9gag");
        client.say(user.getNick(), "#   " + CONFIG.get('irc:nick') + " 9gag");
    }
};