var url = require('url');
var request = require('request');
var __ = require('underscore')._;
var util = require('util');
var Entities = require('html-entities').AllHtmlEntities;
var entities = new Entities();
GLaDOS.register({
    'name': 'urltitle',
    'description': [
        'When someone send an url to the channel, the bot will automatically post the title of the url.',
        'However, some hosts have specific informations that will be postet, such as:',
        'YouTube: "YouTube: <Video title> [<Video length>]"',
        'Imgur: "Imgur: <Image title> (at imgur.com)"',
        'Vimeo: "Vimeo: <Video title> [<Video length>]"',
        'Everything else: "Title: <page title> (at <host>)"'
    ]
},function(ircEvent, command) {
    ircEvent('message', function(channel, user, text) {
        if( channel.getNickList().indexOf('Ares') !== -1 ) return; //Fuck you Ares
        var match = text.match(/(((ftp|https?):\/\/)[\-\w@:%_\+.~#?,&\/\/=]+)|((mailto:)?[_.\w-]+@([\w][\w\-]+\.)+[a-zA-Z]{2,3})/g);
        if(match !== null) { //found URL
            var url_string = match[0];

            var URL = url.parse(match[0], true, true);

            /* YouTube URL */
            if( __.indexOf(['youtube.com', 'www.youtube.com', 'youtu.be', 'www.youtu.be'], URL.hostname) !== -1 ) {
                var videoID = null;
                if(URL.hostname == 'youtube.com' || URL.hostname == 'www.youtube.com') {
                    videoID = URL.query.v;
                }
                else if(URL.hostname == 'youtu.be' || URL.hostname == 'www.youtu.be') {
                    videoID = URL.pathname.substr(1);
                }
                
                if(videoID) {
                    request({
                        url: 'http://gdata.youtube.com/feeds/api/videos/' + videoID + '?v=2&alt=json',
                        'json': true
                    }, function (error, response, body) {
                        if (!error && response.statusCode == 200) {
                            var entry = body.entry;
                            var title = entry.title.$t;
                            var time = formatTime(entry.media$group.yt$duration.seconds);
                            channel.say('YouTube: ' + title + ' [' + time + ']');
                        }
                        else {
                            GLaDOS.logger.error('[urltitle/youtube] %s', (error||'Unknown Error'), error);
                        }
                    });
                }
            }
            /* Imgur URL */
            else if( __.indexOf(['i.imgur.com', 'www.i.imgur.com', 'imgur.com', 'www.imgur.com'], URL.hostname) !== -1 ) {
                var imgurID = null;
                if(URL.hostname == 'i.imgur.com' || URL.hostname == 'www.i.imgur.com') {
                    imgurID = URL.pathname.substr(1).split('.')[0];
                }
                else if(URL.hostname == 'imgur.com' || URL.hostname == 'www.imgur.com') {
                    imgurID = URL.pathname.substr(1);
                }
                request({
                    url: 'https://api.imgur.com/3/image/'+imgurID,
                    headers: {'Authorization': 'Client-ID 55586c3a36cef27'},
                    'json': true
                }, function (error, response, body) {
                    if (!error && response.statusCode == 200) {
                        var title = body.data.title||'null';
                        var width = body.data.width;
                        var height = body.data.height;
                        var size = body.data.size;
                        var nsfw = body.data.nsfw ? ', NSFW' : '';
                        channel.say('Imgur: ' + title + ' [' + width + 'x' + height + ', ' + readableNumber(size) + '' + nsfw + ']');
                    }
                    else {
                        GLaDOS.logger.error('[urltitle/imgur] %s', (error||'Unknown Error'), error);
                    }
                });
            }
            /* Vimeo URL */
            else if( __.indexOf(['vimeo.com', 'www.vimeo.com'], URL.hostname) !== -1 ) {
                var videoId = URL.pathname.substr(1);
                request({
                    url: 'http://vimeo.com/api/v2/video/' + videoId + '.json',
                    'json': true
                }, function (error, response, body) {
                    if (!error && response.statusCode == 200) {
                        var title = body[0].title;
                        var time = formatTime(body[0].duration);
                        channel.say('Vimeo: ' + title + ' [' + time + ']');
                    }
                    else {
                        GLaDOS.logger.error('[urltitle/vimeo] %s', (error||'Unknown Error'), error);
                    }
                });
            }
            /* Reddit URL */
            else if( __.indexOf(['reddit.com', 'redd.it', 'www.reddit.com', 'www.redd.it'], URL.hostname) !== -1 ) {
                var article = null;
                if(URL.hostname == 'redd.it' || URL.hostname == 'www.redd.it') {
                    article = URL.pathname.substr(1);
                }
                else if(URL.hostname == 'reddit.com' || URL.hostname == 'www.reddit.com') {
                    article = URL.pathname.split("/")[4];
                }
                request({
                    uri: 'http://www.reddit.com/comments/' + article + '.json',
                    json: true,
                    headers: {
                        'User-Agent': 'GLaDOS/IRC-Bot - https://github.com/maddin77/GLaDOS'
                    }
                }, function (error, response, body) {
                    if (!error && response.statusCode == 200) {
                        var data = body[0].data.children[0].data;
                        channel.say('Reddit: ' + data.title + ' - /r/' + data.subreddit + ' - Score: ' + data.score + ' (↑' + data.ups + ', ↓' + data.downs + ')');
                    }
                    else {
                        console.error('[urltitle/reddit] %s', (error||'Unknown Error'), error);
                    }
                });
            }
            /* Anything else */
            else {
                if(match[0].match(/\.(png|jpg|jpeg|gif|txt|zip|7zip|tar\.bz|js|css)/)) return; //file URL
                request(URL.href, function (error, response, body) {
                    if (!error && response.statusCode == 200) {
                        var re = /(<\s*title[^>]*>(.+?)<\s*\/\s*title)>/gi;
                        var match = re.exec(body);
                        if (match && match[2]) {
                            var title = match[2];
                            title = title.replace(/\n/g, ' ');
                            
                            channel.say('Title: ' + entities.decode(title) + ' (at ' + URL.host + ')');
                        }
                    }
                    else {
                        GLaDOS.logger.error('[urltitle/*] %s', (error||'Unknown Error'), error);
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
function readableNumber(bytes) {
    var s = ['bytes', 'kB', 'MB', 'GB', 'TB', 'PB'];
    var e = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, e)).toFixed(2) + " " + s[e];
}