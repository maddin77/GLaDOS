var request = require('request');
var WeatherPlugin = function() {};
WeatherPlugin.prototype.onCommand = function(server, channel, cmdName, params, user, msg, text) {
    if(cmdName == "weather" || cmdName == "w") {
        if(params.length < 1) return user.notice("!weather <city>");
        var city = msg;
        var url = "http://api.openweathermap.org/data/2.1/find/name?q=" + encodeURIComponent(city) + "&units=metric";
        request(url, function (error, response, body) {
            if (!error && response.statusCode == 200 && typeof body !== "undefined") {
                var resp = JSON.parse(body);
                if(resp.cod == "200") {
                    
                    var country = resp.list[0].sys.country;
                    var desc = resp.list[0].weather[0].description;
                    var name = resp.list[0].name;
                    var temp =  resp.list[0].main.temp;
                    var temp_min =  resp.list[0].main.temp_min;
                    var temp_max =  resp.list[0].main.temp_max;
                    var wind =  resp.list[0].wind.speed;
                    var clouds =  resp.list[0].clouds.all;
                    var humidity = resp.list[0].main.humidity;
                    var hpa = resp.list[0].main.pressure;

                    channel.say(user.getNick() + ': ' + name+' (' + country + '): '+desc+'. Temperature: '+temp+'°C ('+temp_min+'°C - '+temp_max+'°C). Wind: '+wind+'m/s. Clouds: '+clouds+'%. Humidity: '+humidity+'%. Atmospheric pressure: '+hpa+' hPa.');
                }
                else {
                    channel.say(user.getNick() + ': ' + resp.message);
                }
            }
            else {
                channel.say(user.getNick() + ': Unable to collect data from openweathermap.org');
            }
        });
    }
};
WeatherPlugin.prototype.onHelp = function(server, user, text) {
    user.say("The Weather Plugin can be used to get information about the current weather in a specific location.");
    user.say("Commands: !weather <city>, !w <city>");
};
module.exports = new WeatherPlugin();