var url = require('url');
var request = require('request');
var __ = require('underscore')._;
GLaDOS.register({
    'name': 'urltitle',
    'description': [
        'When someone send an url to the channel, the bot will automatically post the title of the url.',
        'However, some hosts have specific informations that will be postet, such as:',
        'YouTube: "YouTube: <Title of the Video> [<Length of the Video>]"',
        'Imgur: "Imgur: <Image title> (at imgur.com)"',
        'Everything else: "Title: <page title> (at <host>)"'
    ]
},function(ircEvent, command) {
    ircEvent('message', function(channel, user, text) {
        var match = text.match(/(((ftp|https?):\/\/)[\-\w@:%_\+.~#?,&\/\/=]+)|((mailto:)?[_.\w-]+@([\w][\w\-]+\.)+[a-zA-Z]{2,3})/g);
        if(match !== null) { //found URL
            var url_string = match[0];
            //if(match[0].match(/\.(png|jpg|jpeg|gif|txt|zip|7zip|tar\.bz|js|css)/)) return; //file URL

            var URL = url.parse(match[0], true, true);

            /* YouTube URL */
            if( __.indexOf(['youtube.com', 'www.youtube.com', 'youtu.be', 'www.youtu.be'], URL.hostname) !== -1 ) {
                var videoID = null;
                if(URL.hostname == "youtube.com" || URL.hostname == "www.youtube.com") {
                    videoID = URL.query.v;
                }
                else if(URL.hostname == "youtu.be" || URL.hostname == "www.youtu.be") {
                    videoID = URL.pathname.substr(1);
                }
                
                if(videoID) {
                    request("http://gdata.youtube.com/feeds/api/videos/" + videoID + "?v=2&alt=json", function (error, response, body) {
                        if (!error && response.statusCode == 200) {
                            var data = JSON.parse(body);
                            var entry = data.entry;
                            var title = entry.title.$t;
                            var time = formatTime(entry.media$group.yt$duration.seconds);
                            channel.say("YouTube: " + title + " [" + time + "]");
                        }
                    });
                }
            }
            /* Imgur URL */
            else if( __.indexOf(['i.imgur.com', 'www.i.imgur.com', 'imgur.com', 'www.imgur.com'], URL.hostname) !== -1 ) {
                var imgurID = null;
                if(URL.hostname == "i.imgur.com" || URL.hostname == "www.i.imgur.com") {
                    imgurID = URL.pathname.substr(1).split('.')[0];
                }
                else if(URL.hostname == "imgur.com" || URL.hostname == "www.imgur.com") {
                    imgurID = URL.pathname.substr(1);
                }
                request({
                    url: 'https://api.imgur.com/3/image/'+imgurID,
                    headers: {'Authorization': 'Client-ID 55586c3a36cef27'},
                    'json': true
                }, function (error, response, body) {
                    if (!error && response.statusCode == 200) {
                        if(body.data.hasOwnProperty('title')) {
                            if(body.data.title !== null) {
                                channel.say("Imgur: " + body.data.title + " (at imgur.com)");
                            }
                        }
                    }
                });
            }
            /* Anything else */
            else {
                request(URL.href, function (error, response, body) {
                    if (!error && response.statusCode == 200) {
                        var re = /(<\s*title[^>]*>(.+?)<\s*\/\s*title)>/gi;
                        var match = re.exec(body);
                        if (match && match[2]) {
                            var title = match[2];
                            title = title.replace(/\n/g, ' ');
                            channel.say("Title: " + title + " (at " + URL.host + ")");
                        }
                    }
                });
            }
        }
    });
});
function formatTime(seconds) {
    return Math.floor(seconds / 60)+':'+pad(seconds % 60);
}
function pad(num) {
    var s = "0" + num;
    return s.substr(s.length-2);
}