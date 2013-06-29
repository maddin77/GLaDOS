module.exports = {
    /*==========[ +INFO+ ]==========*/
    info: {
        description: "Sucht nach einem oder mehrteren Suchbegriffen auf Google und Postet den ersten Link.",
        commands: ["{C}g <Suchbegriff(e)>", "{C}google <Suchbegriff(e)>", "{N} such(e) <Suchbegriff(e)>", "{N} such(e) nach <Suchbegriff(e)>", "{N} google nach <Suchbegriff(e)>"]
    },
    /*==========[ -INFO- ]==========*/
    google: require('google'),
    onCommand: function(client, server, channel, commandChar, name, params, user, text, message) {
        if(name == "g" || name == "google") {
            if( params.length === 0 ) return client.notice(user.getNick(), commandChar + name + " <Suchbegriff(e)>");
            this.google(text, function(err, next, links) {
                if(links.length > 0) {
                    client.say(channel.getName(), user.getNick() + ": " + links[0].title + " (" + links[0].link + ")" );
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
            var text = match[2];
            this.google(text, function(err, next, links) {
                if(links.length > 0) {
                    client.say(channel.getName(), user.getNick() + ": " + links[0].title + " (" + links[0].link + ")" );
                }
                else {
                    client.say(channel.getName(), user.getNick() + ": Unter \"" + text + "\" wurde nichts gefunden.");
                }
            });
        });
    }
};