module.exports = {
    onCommand: function(client, server, channel, commandChar, name, params, user, text, message) {
        if(name == "facepalm" || name == "fp") {
            REQUEST("http://facepalm.org/img.php", function (error, response, body) {
                var img = "http://facepalm.org/" + response.req.path;
                client.say(channel.getName(), user.getNick() + ": " + img);
            });
        }
    },
    onHelpRequest: function(client, server, user, message, parts) {
        client.say(user.getNick(), "# Beschreibung:");
        client.say(user.getNick(), "#   Postet den Link eines zufälligen Facepalm-Bildes im Channel.");
        client.say(user.getNick(), "# Verwendung:");
        client.say(user.getNick(), "#   !facepalm");
        client.say(user.getNick(), "#   !fp");
    }
};