module.exports = {
    onCommand: function(client, server, channel, commandChar, name, params, user, text, message) {
        if(name == "bing") {
            var url = "http://www.bing.com/search?q=" + encodeURIComponent(text);
            REQUEST(url, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    var $ = CHEERIO.load(body);
                    var link = $('.sb_tlst h3 a').attr('href');
                    client.say(channel.getName(), user.getNick() + ": " + link);
                }
            });
        }
    },
    onResponseMessage: function(client, server, channel, user, message) {
        message.rmatch("^(such nach|suche nach|such|suche) (.*)", function(match) {
            var url = "http://www.bing.com/search?q=" + encodeURIComponent(match[2]);
            REQUEST(url, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    var $ = CHEERIO.load(body);
                    var link = $('.sb_tlst h3 a').attr('href');
                    client.say(channel.getName(), user.getNick() + ": " + link);
                }
            });
        });
    },
    onHelpRequest: function(client, server, user, message, parts) {
        client.say(user.getNick(), "# Beschreibung:");
        client.say(user.getNick(), "#   Sucht nach einem oder mehrteren Suchbegriffen auf www.bing.com und Postet den ersten Link.");
        client.say(user.getNick(), "# Verwendung:");
        client.say(user.getNick(), "#   !bing <Suchbegriff(e)>");
        client.say(user.getNick(), "#   " + CONFIG.get('irc:nick') + " such(e) <Suchbegriff(e)>");
        client.say(user.getNick(), "#   " + CONFIG.get('irc:nick') + " such(e) nach <Suchbegriff(e)>");
    }
};