module.exports = {
    onCommand: function(client, server, channel, commandChar, name, params, user, text, message) {
        if(name == "weather" || name == "wetter" || name == "w") {
            if( params.length === 0 ) return client.notice(user.getNick(), commandChar + name + " <Stadt>");
            var city = text;
            var url = "http://api.openweathermap.org/data/2.1/find/name?q=" + encodeURIComponent(city) + "&cnt=1&lang=de";
            REQUEST(url, function (error, response, body) {
                if (!error && response.statusCode == 200 && typeof body !== "undefined") {
                    var resp = JSON.parse(body);
                    if(resp.cod == "200") {
                        city = resp.list[0].name;
                        var temp = (resp.list[0].main.temp - 273.15).toFixed(1);
                        var condition = resp.list[0].weather[0].main;
                        client.say(channel.getName(), "Wettervorhersage für " + city + ": " + condition + " bei " + temp + "°C");
                    }
                    else {
                        client.say(channel.getName(), city + " wurde nicht gefunden.");
                    }
                }
                else {
                    client.say(channel.getName(), city + " wurde nicht gefunden.");
                }
            });
        }
    },
    onResponseMessage: function(client, server, channel, user, message) {
        message.rmatch("^(wetter|wie ist das wetter in) (.*)", function(match) {
            var city = match[2];
            var url = "http://api.openweathermap.org/data/2.1/find/name?q=" + encodeURIComponent(city) + "&cnt=1&lang=de";
            REQUEST(url, function (error, response, body) {
                if (!error && response.statusCode == 200 && typeof body !== "undefined") {
                    var resp = JSON.parse(body);
                    if(resp.cod == "200") {
                        city = resp.list[0].name;
                        var temp = (resp.list[0].main.temp - 273.15).toFixed(1);
                        var condition = resp.list[0].weather[0].main;
                        client.say(channel.getName(), "Wettervorhersage für " + city + ": " + condition + " bei " + temp + "°C");
                    }
                    else {
                        client.say(channel.getName(), city + " wurde nicht gefunden.");
                    }
                }
                else {
                    client.say(channel.getName(), city + " wurde nicht gefunden.");
                }
            });
        });
    }
};