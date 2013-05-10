module.exports = {
    /*==========[ +INFO+ ]==========*/
    info: {
        description: "Postet den Titel einer Webseite im Channel, wenn ein Link im Channel gepostet wurde. Wird ein YouTube-Link gepostet, so wird der Titel des Videos sowie die Länge gepostet.",
        commands: ["-"]
    },
    /*==========[ -INFO- ]==========*/

    onChannelMessage: function(client, server, channel, user, message) {
        var _m = message.match(/(((ftp|https?):\/\/)[\-\w@:%_\+.~#?,&\/\/=]+)|((mailto:)?[_.\w-]+@([\w][\w\-]+\.)+[a-zA-Z]{2,3})/g);
        if(_m !== null) {

            var url = _m[0];
            if(url.match(/\.(png|jpg|jpeg|gif|txt|zip|7zip|tar\.bz|js|css)/)) return;
            var url_parsed = require('url').parse(url);
            var host = url_parsed.host;
            if(host == "youtube.com" || host == "www.youtube.com") {
                var vID = require('querystring').parse(url_parsed.query).v;
                if(vID) {
                    REQUEST("http://gdata.youtube.com/feeds/api/videos/" + vID + "?v=2&alt=json", function (error, response, body) {
                        if (!error && response.statusCode == 200) {
                            var data = JSON.parse(body);
                            var entry = data.entry;
                            var title = entry.title.$t;
                            var time = UTIL.formatTime(entry.media$group.yt$duration.seconds);
                            client.say(channel.getName(), "YouTube: " + title + " [" + time + "]");
                        }
                    });
                }
            }
            else if(host == "youtu.be" || host == "www.youtu.be") {
                var videoID = url.split("/").pop();
                if(videoID) {
                    REQUEST("http://gdata.youtube.com/feeds/api/videos/" + videoID + "?v=2&alt=json", function (error, response, body) {
                        if (!error && response.statusCode == 200) {
                            var data = JSON.parse(body);
                            var entry = data.entry;
                            var title = entry.title.$t;
                            var time = UTIL.formatTime(entry.media$group.yt$duration.seconds);
                            client.say(channel.getName(), "YouTube: " + title + " [" + time + "]");
                        }
                    });
                }
            }
            else {
                REQUEST(url, function (error, response, body) {
                    if (!error && response.statusCode == 200) {
                        var re = /(<\s*title[^>]*>(.+?)<\s*\/\s*title)>/gi;
                        var match = re.exec(body);
                        if (match && match[2]) {
                            var title = match[2];
                            title = title.replace(/\n/g, ' ');
                            client.say(channel.getName(), "Title: " + title + " (" + host + ")");
                        }
                    }
                });
            }
        }
    }
};