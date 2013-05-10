module.exports = {
    /*==========[ +INFO+ ]==========*/
    info: {
        description: "Postet die Definition des Begriffes von www.urbandictionary.com im Channel.",
        commands: ["{C}urban <Text>", "{C}ud <Text>"]
    },
    /*==========[ -INFO- ]==========*/

    onCommand: function(client, server, channel, commandChar, name, params, user, text, message) {
        if(name == "ud" || name == "urban") {
            if( params.length === 0 ) return client.notice(user.getNick(), commandChar + name + " <Text>");
            var url = "http://www.urbandictionary.com/define.php?term=" + encodeURIComponent(text);
            REQUEST(url, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    var $ = CHEERIO.load(body);
                    var definition = $('#entries tr').eq(1).find(".text .definition").text();
                    definition = definition.replace(/(\r\n|\n|\r)/gm," ");
                    client.say(channel.getName(), text + ": " + definition);

                    var example = $('#entries tr').eq(1).find(".text .example").text();
                    if(example !== null && example !== "") {
                        client.say(channel.getName(), "Example: " + example);
                    }
                }
            });
            return true;
        }
    },
    onHelpRequest: function(client, server, user, message, parts) {
        client.say(user.getNick(), "# Beschreibung:");
        client.say(user.getNick(), "#   Postet die Definition des Begriffes von www.urbandictionary.com im Channel.");
        client.say(user.getNick(), "# Verwendung:");
        client.say(user.getNick(), "#   !urban <Text>");
        client.say(user.getNick(), "#   !ud <Text>");
    }
};