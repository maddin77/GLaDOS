module.exports = {
    /*==========[ +INFO+ ]==========*/
    info: {
        description: "Returns a random image from 9gag.com.",
        commands: ["{C}9gag"]
    },
    /*==========[ -INFO- ]==========*/
    getRandomImage: function(callback) {
        REQUEST("http://9gag.com/random", function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var $ = CHEERIO.load(body);
                var title = $(".badge-item-title").text();
                var src = $(".badge-item-img").attr('src');
                GOOGL.shorten(src, function (shortUrl) {
                    callback(title, shortUrl.id);
                });
            }
        });
    },
    onCommand: function(client, server, channel, commandChar, name, params, user, text, message) {
        if(name == "9gag") {
            this.getRandomImage(function(title, url) {
                client.say(channel.getName(), user.getNick() + ": " + title + " (" + url + ")");
            });
            return true;
        }
    }
};