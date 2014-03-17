'use strict';
var url = require('url');
var request = require('request');
var __ = require('underscore')._;
var utils = require(__dirname + '/../lib/utils');
var Entities = require('html-entities').AllHtmlEntities;
var debug = require('debug')('glados:script:urltitle');

//TODO: mega.co.nz

module.exports = function () {
    return function (irc) {
        var entities, getTitle, getYoutubeTitle, getImgurTitle, getRedditTitle, getVimeoTitle, getGithubTitle;

        entities = new Entities();

        getTitle = function (URL, fn) {
            request({
                "uri": URL.href,
                "headers": {
                    "User-Agent": irc.config.userAgent
                }
            }, function (error, res, body) {
                if (!error) {
                    if (res.statusCode === 200) {
                        if (res.headers['content-type'].indexOf('text/html') !== 0) {
                            return fn(false, null);
                        }
                        var match = /(<\s*title[^>]*>(.+?)<\s*\/\s*title)>/gi.exec(body), title;
                        if (match && match[2]) {
                            title = match[2].replace(/(\r\n|\n|\r)/gm, "").trim();
                            fn(true, 'Title: ' + entities.decode(title) + ' (at ' + URL.host + ')');
                        }
                    } else {
                        fn(false, null);
                    }
                } else {
                    debug('[urltitle/*] %s', error);
                    fn(false, null);
                }
            });
        };
        getYoutubeTitle = function (URL, fn) {
            var videoID = null;
            if (URL.hostname === 'youtube.com' || URL.hostname === 'www.youtube.com') {
                videoID = URL.query.v;
            } else if (URL.hostname === 'youtu.be' || URL.hostname === 'www.youtu.be') {
                videoID = URL.pathname.substr(1);
            }
            if (videoID) {
                request({
                    "url": 'http://gdata.youtube.com/feeds/api/videos/' + videoID + '?v=2&alt=json',
                    "json": true,
                    "headers": {
                        "User-Agent": irc.config.userAgent
                    }
                }, function (error, response, data) {
                    if (!error && response.statusCode === 200) {
                        var entry = data.entry,
                            title = entry.title.$t,
                            time = utils.formatTime(entry.media$group.yt$duration.seconds);
                        fn(true, 'YouTube: ' + title + ' [' + time + ']');
                    } else {
                        debug('[urltitle/youtube] %s', error);
                        getTitle(URL, fn);
                    }
                });
            } else {
                getTitle(URL, fn);
            }
        };
        getImgurTitle = function (URL, fn) {
            var imgurID = null;
            if (URL.hostname === 'i.imgur.com' || URL.hostname === 'www.i.imgur.com') {
                imgurID = URL.pathname.substr(1).split('.')[0];
            } else if (URL.hostname === 'imgur.com' || URL.hostname === 'www.imgur.com') {
                imgurID = URL.pathname.substr(1);
            }
            request({
                "url": 'https://api.imgur.com/3/image/' + imgurID,
                "json": true,
                "headers": {
                    "User-Agent": irc.config.userAgent,
                    "Authorization": 'Client-ID ' + irc.config.imgurKey
                }
            }, function (error, response, data) {
                if (!error && response.statusCode === 200) {
                    var title = data.data.title || 'null',
                        width = data.data.width,
                        height = data.data.height,
                        size = data.data.size,
                        nsfw = data.data.nsfw ? ', NSFW' : '';
                    fn(true, 'Imgur: ' + title + ' [' + width + 'x' + height + ', ' + utils.readableNumber(size) + nsfw + ']');
                } else {
                    debug('[urltitle/imgur] %s', error, data);
                    getTitle(URL, fn);
                }
            });
        };
        getVimeoTitle = function (URL, fn) {
            var videoId = URL.pathname.substr(1);
            request({
                "url": 'http://vimeo.com/api/v2/video/' + videoId + '.json',
                "json": true,
                "headers": {
                    "User-Agent": irc.config.userAgent
                }
            }, function (error, response, data) {
                if (!error && response.statusCode === 200) {
                    var title = data[0].title,
                        time = utils.formatTime(data[0].duration);
                    fn(true, 'Vimeo: ' + title + ' [' + time + ']');
                } else {
                    debug('[urltitle/vimeo] %s', error);
                    getTitle(URL, fn);
                }
            });
        };
        getRedditTitle = function (URL, fn) {
            var id;
            if (URL.hostname === 'redd.it' || URL.hostname === 'www.redd.it' || URL.path.match(/^\/(?:r)\/([a-z0-9][a-z0-9_]{2,20})\/(?:comments)\/([a-z0-9]+)\/(?:.+)\/?$/i)) { //reddit Thread
                if (URL.hostname === 'redd.it' || URL.hostname === 'www.redd.it') {
                    id = URL.pathname.substr(1) || null;
                } else {
                    id = URL.pathname.split("/")[4] || null;
                }
                request({
                    "uri": 'http://www.reddit.com/comments/' + id + '.json',
                    "json": true,
                    "headers": {
                        "User-Agent": 'GLaDOS/IRC-Bot - https://github.com/maddin77/GLaDOS'
                    }
                }, function (error, response, data) {
                    if (!error && response.statusCode === 200) {
                        if (data instanceof Array) {
                            data = data[0];
                        }
                        data = data.data.children[0].data;
                        fn(true, 'Reddit: ' + data.title + ' - /r/' + data.subreddit + ' - Score: ' + data.score + ' (↑' + data.ups + ', ↓' + data.downs + ')');
                    } else {
                        debug('[urltitle/reddit/thread] %s', error);
                        getTitle(URL, fn);
                    }
                });
            } else if (URL.path.match(/^\/(?:r)\/([a-z0-9][a-z0-9_]{2,20})(?:\/?)$/i)) { //subreddit
                id = URL.pathname.split("/")[2];
                request({
                    "uri": 'http://www.reddit.com/r/' + id + '/about.json',
                    "json": true,
                    "headers": {
                        "User-Agent": 'GLaDOS/IRC-Bot - https://github.com/maddin77/GLaDOS'
                    }
                }, function (error, response, data) {
                    if (!error && response.statusCode === 200) {
                        data = data.data;
                        var title = 'Reddit: ' + data.title.replace(/(\r\n|\n|\r)/gm, '');
                        if (data.public_description) {
                            title += ' - ' + data.url;
                        }
                        title += ' - Subscribers: ' + data.subscribers;
                        if (data.over18) {
                            title += ' [over18]';
                        }
                        fn(true, title);
                    } else {
                        debug('[urltitle/reddit/subreddit] %s', error);
                        getTitle(URL, fn);
                    }
                });
            } else if (URL.path.match(/^\/(?:user|u)\/([_a-zA-Z0-9\-]{3,20})(?:\/?)$/i)) { //subreddit
                id = URL.pathname.split("/")[2];
                request({
                    "uri": 'http://www.reddit.com/user/' + id + '/about.json',
                    "json": true,
                    "headers": {
                        "User-Agent": 'GLaDOS/IRC-Bot - https://github.com/maddin77/GLaDOS'
                    }
                }, function (error, response, data) {
                    if (!error && response.statusCode === 200) {
                        data = data.data;
                        fn(true, 'Reddit: /u/' + data.name + '/ - Link Karma: ' + data.link_karma + ' - Comment Karma: ' + data.comment_karma);
                    } else {
                        debug('[urltitle/reddit/user] %s', error);
                        getTitle(URL, fn);
                    }
                });
            } else {
                getTitle(URL, fn);
            }
        };
        getGithubTitle = function (URL, fn) {
            var match;
            if ((match = URL.href.match(/^(?:http|https):\/\/gist\.github\.com\/(?:[A-Za-z0-9]+)\/([0-9]+)(?:\/?)$/i)) !== null) {
                request({
                    "uri": 'https://api.github.com/gists/' + match[1],
                    "json": true,
                    "headers": {
                        "User-Agent": 'GLaDOS/IRC-Bot - https://github.com/maddin77/GLaDOS'
                    }
                }, function (error, response, data) {
                    if (!error && response.statusCode === 200) {
                        fn(true, 'GitHub Gists: ' + data.description + ' (' + data.comments + ' Comments, ' + data.forks.length + ' Forks) - by ' + data.user.login);
                    } else {
                        debug('[urltitle/github/gist] %s', error);
                        getTitle(URL, fn);
                    }
                });
            } else if ((match = URL.href.match(/^(?:http|https):\/\/github\.com\/([_a-zA-Z0-9\-]+)\/([_a-zA-Z0-9\-]+)\/issues\/([0-9]+)(?:\/?)/i)) !== null) {
                request({
                    "uri": 'https://api.github.com/repos/' + match[1] + '/' + match[2] + '/issues/' + match[3],
                    "json": true,
                    "headers": {
                        "User-Agent": 'GLaDOS/IRC-Bot - https://github.com/maddin77/GLaDOS'
                    }
                }, function (error, response, data) {
                    if (!error && response.statusCode === 200) {
                        fn(true, 'GitHub Issues: ' + data.title + ' (Issue #' + data.number + ', ' + data.comments + ' Comments) - in ' + match[1] + '/' + match[2] + ' - by ' + data.user.login);
                    } else {
                        debug('[urltitle/github/issues] %s', error);
                        getTitle(URL, fn);
                    }
                });
            } else if ((match = URL.href.match(/^(?:http|https):\/\/github\.com\/([_a-zA-Z0-9\-]+)\/([_a-zA-Z0-9\-]+)\/pull\/([0-9]+)(?:\/?)/i)) !== null) {
                request({
                    "uri": 'https://api.github.com/repos/' + match[1] + '/' + match[2] + '/pulls/' + match[3],
                    "json": true,
                    "headers": {
                        "User-Agent": 'GLaDOS/IRC-Bot - https://github.com/maddin77/GLaDOS'
                    }
                }, function (error, response, data) {
                    if (!error && response.statusCode === 200) {
                        fn(true, 'GitHub Pull Request: ' + data.title + ' (Pull Request #' + data.number + ', ' + data.comments + ' Comments) - in ' + match[1] + '/' + match[2] + ' - by ' + data.user.login);
                    } else {
                        debug('[urltitle/github/pulls] %s', error);
                        getTitle(URL, fn);
                    }
                });
            } else if ((match = URL.href.match(/^(?:http|https):\/\/github\.com\/([_a-zA-Z0-9\-]+)\/([_a-zA-Z0-9\-]+)(?:\/?)/i)) !== null) {
                request({
                    "uri": 'https://api.github.com/repos/' + match[1] + '/' + match[2],
                    "json": true,
                    "headers": {
                        "User-Agent": 'GLaDOS/IRC-Bot - https://github.com/maddin77/GLaDOS'
                    }
                }, function (error, response, data) {
                    if (!error && response.statusCode === 200) {
                        fn(true, 'GitHub Repository: ' + data.full_name + ' - ' + data.description + ' (' + data.stargazers_count + ' Stargazers, ' + data.watchers_count + ' Watchers, ' + data.forks_count + ' Forks)');
                    } else {
                        debug('[urltitle/github/repos] %s', error);
                        getTitle(URL, fn);
                    }
                });
            } else if ((match = URL.href.match(/^(?:http|https):\/\/github\.com\/([_a-zA-Z0-9\-]+)(?:\/?)$/i)) !== null) {
                request({
                    "uri": 'https://api.github.com/users/' + match[1],
                    "json": true,
                    "headers": {
                        "User-Agent": 'GLaDOS/IRC-Bot - https://github.com/maddin77/GLaDOS'
                    }
                }, function (error, response, data) {
                    if (!error && response.statusCode === 200) {
                        fn(true, 'GitHub User: ' + data.login + ' - ' + data.name + ' (' + data.followers + ' Followers, ' + data.public_repos + ' Repositorys, ' + data.public_gists + ' Gists)');
                    } else {
                        debug('[urltitle/github/users] %s', error);
                        getTitle(URL, fn);
                    }
                });
            } else {
                getTitle(URL, fn);
            }
        };

        irc.on('chanmsg', function (event) {
            var URL, match = event.message.match(/(http|ftp|https):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@?\^=%&amp;:\/~\+#]*[\w\-\@?\^=%&amp;\/~\+#])?/i);
            if (match !== null) {
                URL = url.parse(match[0], true, true);

                if (__.indexOf(['youtube.com', 'www.youtube.com', 'youtu.be', 'www.youtu.be'], URL.hostname) !== -1) {
                    getYoutubeTitle(URL, function (success, title) {
                        if (success) {
                            event.channel.say(title);
                        }
                    });
                } else if (__.indexOf(['i.imgur.com', 'www.i.imgur.com', 'imgur.com', 'www.imgur.com'], URL.hostname) !== -1) { /* Imgur URL */
                    getImgurTitle(URL, function (success, title) {
                        if (success) {
                            event.channel.say(title);
                        }
                    });
                } else if (__.indexOf(['vimeo.com', 'www.vimeo.com'], URL.hostname) !== -1) { /* Vimeo URL */
                    getVimeoTitle(URL, function (success, title) {
                        if (success) {
                            event.channel.say(title);
                        }
                    });
                } else if (__.indexOf(['reddit.com', 'redd.it', 'www.reddit.com', 'www.redd.it'], URL.hostname) !== -1) { /* Reddit URL */
                    getRedditTitle(URL, function (success, title) {
                        if (success) {
                            event.channel.say(title);
                        }
                    });
                } else if (__.indexOf(['github.com', 'www.github.com', 'gist.github.com', 'www.gist.github.com'], URL.hostname) !== -1) { /* Github URL */
                    getGithubTitle(URL, function (success, title) {
                        if (success) {
                            event.channel.say(title);
                        }
                    });
                } else { /* Anything else */
                    getTitle(URL, function (success, title) {
                        if (success) {
                            event.channel.say(title);
                        }
                    });
                }
            }
        });
    };
};