module.exports = {
    onCommand: function(client, server, channel, commandChar, name, params, user, text, message) {
        if(name == "isup") {
            if( params.length === 0 ) return client.notice(user.getNick(), commandChar + name + " <Website, z.b google.de>");
            var url = 'http://www.isup.me/' + text;
            REQUEST(url, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    var $ = CHEERIO.load(body);
                    $('#container p, #container br, #container center').remove();
                    var result = $('#container').text().replace(/(?:(?:^|\n)\s+|\s+(?:$|\n))/g,'').replace(/\s+/g,' ');
                    client.say(channel.getName(), user.getNick() + ": " + result);
                }
            });
        }
    },
    onResponseMessage: function(client, server, channel, user, message) {
        message.rmatch("^(ist|is) (.*)( online| offline)(\\?)?", function(match) {
            var url =  'http://www.isup.me/' + match[2];
            REQUEST(url, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    var $ = CHEERIO.load(body);
                    $('#container p, #container br, #container center').remove();
                    var result = $('#container').text().replace(/(?:(?:^|\n)\s+|\s+(?:$|\n))/g,'').replace(/\s+/g,' ');
                    client.say(channel.getName(), user.getNick() + ": " + result);
                }
            });
        });
    },
    onHelpRequest: function(client, server, user, message, parts) {
        client.say(user.getNick(), "# Beschreibung:");
        client.say(user.getNick(), "#   Prüft ob die angegebene Webseite Erreichbar ist.");
        client.say(user.getNick(), "# Verwendung:");
        client.say(user.getNick(), "#   !isup <Website, z.b google.de>");
        client.say(user.getNick(), "#   " + CONFIG.get('irc:nick') + " is <Website, z.b google.de> online?");
        client.say(user.getNick(), "#   " + CONFIG.get('irc:nick') + " ist <Website, z.b google.de> offline");
    }
};