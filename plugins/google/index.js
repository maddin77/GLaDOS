module.exports = {
    /*==========[ +INFO+ ]==========*/
    info: {
        description: "Sucht nach einem oder mehrteren Suchbegriffen auf Google und Postet den ersten Link.",
        commands: ["{C}g <Suchbegriff(e)>", "{C}google <Suchbegriff(e)>", "{N} such(e) <Suchbegriff(e)>", "{N} such(e) nach <Suchbegriff(e)>", "{N} google nach <Suchbegriff(e)>"]
    },
    /*==========[ -INFO- ]==========*/

    qs: require('querystring'),
    google: function(query, callback) {
        var uri = 'http://google.com/search?' + this.qs.stringify({
            'q': encodeURIComponent(query),
            'btnI': 1,
            'hl': 'de',
            'lr': 'de',
            'pws': 0
        });
        REQUEST(uri, function (error, response, body) {
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
            return true;
        }
    },
    onResponseMessage: function(client, server, channel, user, message) {
        message.rmatch("^(such nach|google nach|suche nach|such|suche) (.*)", function(match) {
            this.google(match[2], function(success, url) {
                if(success) {
                    client.say(channel.getName(), user.getNick() + ": " + url);
                }
                else {
                    client.say(channel.getName(), user.getNick() + ": Unter \"" + text + "\" wurde nichts gefunden.");
                }
            });
        });
    }
};