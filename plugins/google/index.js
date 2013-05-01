module.exports = {
    qs: require('querystring'),
    google: function(query, callback) {
        var uri = 'http://google.com/search?' + this.qs.stringify({
            'q': encodeURIComponent(query),
            'btnI': 1,
            'hl': 'de',
            'lr': 'de',
            'pws': 0
        });
        REQUEST({
            uri: uri,
            method: "GET",
            timeout: 2000
        }, function (error, response, body) {
            if(!error && response.statusCode >= 200 && response.statusCode < 300) {
                if(response.request.uri.search === null) {
                    callback(true, response.request.uri.href);
                }
                else {
                    callback(false);
                }
            }
        });
    },
    onCommand: function(client, server, channel, commandChar, name, params, user, text, message) {
        if(name == "g" || name == "google") {
            if( params.length === 0 ) return client.notice(user.getNick(), commandChar + name + " <Suchbegriff(e)>");
            this.google(text, function(success, url) {
                if(success) {
                    client.say(channel.getName(), user.getNick() + ": " + url);
                }
                else {
                    client.say(channel.getName(), user.getNick() + ": Unter \"" + text + "\" wurde nichts gefunden.");
                }
            });
        }
    },
    onResponseMessage: function(client, server, channel, user, message) {
        message.rmatch("^(such nach|google nach|suche nach|such|suche) (.*)", function(match) {
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
        client.say(user.getNick(), "#   Sucht nach einem oder mehrteren Suchbegriffen auf Google und Postet den ersten Link.");
        client.say(user.getNick(), "# Verwendung:");
        client.say(user.getNick(), "#   !g <Suchbegriff(e)>");
        client.say(user.getNick(), "#   !google <Suchbegriff(e)>");
        client.say(user.getNick(), "#   " + CONFIG.get('irc:nick') + " such(e) <Suchbegriff(e)>");
        client.say(user.getNick(), "#   " + CONFIG.get('irc:nick') + " such(e) nach <Suchbegriff(e)>");
        client.say(user.getNick(), "#   " + CONFIG.get('irc:nick') + " google nach <Suchbegriff(e)>");
    }
};