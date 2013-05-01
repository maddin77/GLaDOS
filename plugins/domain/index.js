module.exports = {
    onCommand: function(client, server, channel, commandChar, name, params, user, text, message) {
        if(name == "domain") {
            var url = "http://whois.domaintools.com/" + text;
            REQUEST(url, function (error, response, body) {
                if (!error) {
                    var $ = CHEERIO.load(body);
                    console.log(body, response.statusCode);
                    if(response.statusCode == 403) {
                        return client.say(channel.getName(), user.getNick() + ": The domain or IP you have entered seems malformed.");
                    }
                    if(new RegExp("<h2>This domain name is not registered</h2>", "gm").test(body)) {
                        return client.say(channel.getName(), user.getNick() + ": This domain name is not registered.");
                    }
                    /*if(response.statusCode == 404 || pre.length === 0) {
                        client.say(channel.getName(), user.getNick() + ": Invalid Domain/Request");
                        return;
                    }
                    var parts = pre.split("\n");
                    for(var i=0; i<parts.length; i++) {
                        if(parts[i] == "Status: connect") {
                            client.say(channel.getName(), user.getNick() + ": " + text + " ist bereits registriert.");
                            return;
                        }
                        else if(parts[i] == "Status: invalid") {
                            client.say(channel.getName(), user.getNick() + ": Invalid Domain/Request");
                            return;
                        }
                        else if(parts[i] == "Status: free") {
                            client.say(channel.getName(), user.getNick() + ": " + text + " ist Frei.");
                            return;
                        }
                    }*/
                }
            });
        }
    }
};