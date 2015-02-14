var url_module = require('url');
var request = require('request');
var URLTitlePlugin = function() {};
URLTitlePlugin.prototype.onChannelMessage = function( server, channel, user, text ) {
    var that = this;
    var _m = text.match(/(((ftp|https?):\/\/)[\-\w@:%_\+.~#?,&\/\/=]+)|((mailto:)?[_.\w-]+@([\w][\w\-]+\.)+[a-zA-Z]{2,3})/g);
    if(_m !== null) { //found URL
        var url = _m[0];

        if(url.match(/\.(png|jpg|jpeg|gif|txt|zip|7zip|tar\.bz|js|css)/)) return; //file URL

        var url_parsed = url_module.parse(url);
        var host = url_parsed.host;

        if(host == "youtube.com" || host == "www.youtube.com" || host == "youtu.be" || host == "www.youtu.be") { //youtube URL
            var videoID = null;
            if(host == "youtube.com" || host == "www.youtube.com") videoID = require('querystring').parse(url_parsed.query).v;
            else if(host == "youtu.be" || host == "www.youtu.be") videoID = url.split("/").pop();
            
            if(videoID) {
                request("http://gdata.youtube.com/feeds/api/videos/" + videoID + "?v=2&alt=json", function (error, response, body) {
                    if (!error && response.statusCode == 200) {
                        var data = JSON.parse(body);
                        var entry = data.entry;
                        var title = entry.title.$t;
                        var time = that.formatTime(entry.media$group.yt$duration.seconds);
                        channel.say("YouTube: " + title + " [" + time + "]");
                    }
                });
            }
        }
        else {
            request(url, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    var re = /(<\s*title[^>]*>(.+?)<\s*\/\s*title)>/gi;
                    var match = re.exec(body);
                    if (match && match[2]) {
                        var title = match[2];
                        title = title.replace(/\n/g, ' ');
                        channel.say("Title: " + title + " (" + host + ")");
                    }
                }
            });
        }
    }
};
URLTitlePlugin.prototype.formatTime = function(seconds) {
    return Math.floor(seconds / 60)+':'+this.pad(seconds % 60);
};
URLTitlePlugin.prototype.pad = function(num) {
    var s = "0" + num;
    return s.substr(s.length-2);
};
URLTitlePlugin.prototype.onHelp = function(server, user, text) {
    user.say("Get the title of URL's and post the title in the Channel.");
    user.say("Commands: -");
};
module.exports = new URLTitlePlugin();