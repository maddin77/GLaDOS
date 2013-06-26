module.exports = {
    /*==========[ +INFO+ ]==========*/
    info: {
        description: "Postet den Link eines zufälligen Facepalm-Bildes im Channel.",
        commands: ["{C}facepalm", "{C}fp"]
    },
    /*==========[ -INFO- ]==========*/

    onCommand: function(client, server, channel, commandChar, name, params, user, text, message) {
        if(name == "facepalm" || name == "fp") {
            REQUEST("http://facepalm.org/img.php", function (error, response, body) {
                GOOGL.shorten("http://facepalm.org" + response.req.path, function (shortUrl) {
                    client.say(channel.getName(), user.getNick() + ": " + shortUrl.id);
                });
            });
            return true;
        }
    }
};