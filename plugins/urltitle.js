/*global GLaDOS */
'use strict';
var url = require('url');
var request = require('request');
var __ = require('underscore')._;
var util = require('util');
var Entities = require('html-entities').AllHtmlEntities;
var entities = new Entities();

function pad(num) {
    var s = "0" + num;
    return s.substr(s.length - 2);
}
function formatTime(seconds) {
    return Math.floor(seconds / 60) + ':' + pad(seconds % 60);
}
function readableNumber(bytes) {
    var s = ['bytes', 'kB', 'MB', 'GB', 'TB', 'PB'],
        e = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, e)).toFixed(2) + " " + s[e];
}
function getTitle(URL, cb) {
    request(URL.href, function (error, res, body) {
        if (!error) {
            if (res.statusCode === 200) {
                if (res.headers['content-type'].indexOf('text/html') !== 0) {
                    return cb(false, null);
                }
                var match = /(<\s*title[^>]*>(.+?)<\s*\/\s*title)>/gi.exec(body), title;
                if (match && match[2]) {
                    title = match[2].replace(/(\r\n|\n|\r)/gm, "").trim();
                    cb(true, 'Title: ' + entities.decode(title) + ' (at ' + URL.host + ')');
                }
            } else {
                cb(false, null);
            }
        } else {
            GLaDOS.logger.error('[urltitle/*] %s', (error || 'Unknown Error'), error);
            cb(false, null);
        }
    });
}
function getYoutubeTitle(URL, cb) {
    var videoID = null;
    if (URL.hostname === 'youtube.com' || URL.hostname === 'www.youtube.com') {
        videoID = URL.query.v;
    } else if (URL.hostname === 'youtu.be' || URL.hostname === 'www.youtu.be') {
        videoID = URL.pathname.substr(1);
    }
    if (videoID) {
        request({
            url: 'http://gdata.youtube.com/feeds/api/videos/' + videoID + '?v=2&alt=json',
            'json': true
        }, function (error, response, body) {
            if (!error && response.statusCode === 200) {
                var entry = body.entry,
                    title = entry.title.$t,
                    time = formatTime(entry.media$group.yt$duration.seconds);
                cb(true, 'YouTube: ' + title + ' [' + time + ']');
            } else {
                GLaDOS.logger.error('[urltitle/youtube] %s', (error || 'Unknown Error'), error);
                getTitle(URL, cb);
            }
        });
    } else {
        getTitle(URL, cb);
    }
}
function getImgurTitle(URL, cb) {
    var imgurID = null;
    if (URL.hostname === 'i.imgur.com' || URL.hostname === 'www.i.imgur.com') {
        imgurID = URL.pathname.substr(1).split('.')[0];
    } else if (URL.hostname === 'imgur.com' || URL.hostname === 'www.imgur.com') {
        imgurID = URL.pathname.substr(1);
    }
    request({
        url: 'https://api.imgur.com/3/image/' + imgurID,
        headers: {
            'Authorization': 'Client-ID ' + GLaDOS.config.get('imgurKey')
        },
        'json': true
    }, function (error, response, body) {
        if (!error && response.statusCode === 200) {
            var title = body.data.title || 'null',
                width = body.data.width,
                height = body.data.height,
                size = body.data.size,
                nsfw = body.data.nsfw ? ', NSFW' : '';
            cb(true, 'Imgur: ' + title + ' [' + width + 'x' + height + ', ' + readableNumber(size) + nsfw + ']');
        } else {
            GLaDOS.logger.error('[urltitle/imgur] %s', (error || 'Unknown Error'), error);
            getTitle(URL, cb);
        }
    });
}
function getVimeoTitle(URL, cb) {
    var videoId = URL.pathname.substr(1);
    request({
        url: 'http://vimeo.com/api/v2/video/' + videoId + '.json',
        'json': true
    }, function (error, response, body) {
        if (!error && response.statusCode === 200) {
            var title = body[0].title,
                time = formatTime(body[0].duration);
            cb(true, 'Vimeo: ' + title + ' [' + time + ']');
        } else {
            GLaDOS.logger.error('[urltitle/vimeo] %s', (error || 'Unknown Error'), error);
            getTitle(URL, cb);
        }
    });
}
function getRedditTitle(URL, cb) {
    var article = null, subreddit;
    if (URL.hostname === 'redd.it' || URL.hostname === 'www.redd.it') {
        article = URL.pathname.substr(1) || null;
    } else if (URL.hostname === 'reddit.com' || URL.hostname === 'www.reddit.com') {
        article = URL.pathname.split("/")[4] || null;
    }
    if (article === null) {
        subreddit = URL.pathname.split("/")[2];
        request({
            uri: 'http://www.reddit.com/r/' + subreddit + '/about.json',
            json: true,
            headers: {
                'User-Agent': 'GLaDOS/IRC-Bot - https://github.com/maddin77/GLaDOS'
            }
        }, function (error, response, body) {
            if (!error && response.statusCode === 200) {
                var data = body.data,
                    title = 'Reddit: ' + data.title.replace(/(\r\n|\n|\r)/gm, '') + ' - ' + data.public_description + ' - Subscribers: ' + data.subscribers;
                if (data.over18) {
                    title += ' [over18]';
                }
                cb(true, title);
            } else {
                GLaDOS.logger.error('[urltitle/reddit] %s %s', response.statusCode, (error || 'Unknown Error'), error);
                getTitle(URL, cb);
            }
        });
    } else {
        request({
            uri: 'http://www.reddit.com/comments/' + article + '.json',
            json: true,
            headers: {
                'User-Agent': 'GLaDOS/IRC-Bot - https://github.com/maddin77/GLaDOS'
            }
        }, function (error, response, body) {
            if (!error && response.statusCode === 200) {
                var data = body;
                if (data instanceof Array) {
                    data = body[0];
                }
                data = data.data.children[0].data;
                cb(true, 'Reddit: ' + data.title + ' - /r/' + data.subreddit + ' - Score: ' + data.score + ' (↑' + data.ups + ', ↓' + data.downs + ')');
            } else {
                GLaDOS.logger.error('[urltitle/reddit] %s', (error || 'Unknown Error'), error);
                getTitle(URL, cb);
            }
        });
    }
}

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
}, function (ircEvent, command) {
    ircEvent('message', function (channel, user, text) {
        //if( channel.getNickList().indexOf('Ares') !== -1 ) return; //Fuck you Ares
        var match = text.match(/(http|ftp|https):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@?^=%&amp;:/~\+#]*[\w\-\@?^=%&amp;/~\+#])?/i), URL;
        if (match !== null) { //found URL
            //URL = match[0];
            URL = url.parse(match[0], true, true);

            /* YouTube URL */
            if (__.indexOf(['youtube.com', 'www.youtube.com', 'youtu.be', 'www.youtu.be'], URL.hostname) !== -1) {
                getYoutubeTitle(URL, function (success, title) {
                    if (success) {
                        channel.say(title);
                    }
                });
            } else if (__.indexOf(['i.imgur.com', 'www.i.imgur.com', 'imgur.com', 'www.imgur.com'], URL.hostname) !== -1) { /* Imgur URL */
                getImgurTitle(URL, function (success, title) {
                    if (success) {
                        channel.say(title);
                    }
                });
            } else if (__.indexOf(['vimeo.com', 'www.vimeo.com'], URL.hostname) !== -1) { /* Vimeo URL */
                getVimeoTitle(URL, function (success, title) {
                    if (success) {
                        channel.say(title);
                    }
                });
            } else if (__.indexOf(['reddit.com', 'redd.it', 'www.reddit.com', 'www.redd.it'], URL.hostname) !== -1) { /* Reddit URL */
                getRedditTitle(URL, function (success, title) {
                    if (success) {
                        channel.say(title);
                    }
                });
            } else { /* Anything else */
                getTitle(URL, function (success, title) {
                    if (success) {
                        channel.say(title);
                    }
                });
            }
        }
    });
});