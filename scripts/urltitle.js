'use strict';
var url = require('url');
var request = require('request');
var _ = require('underscore')._;
var utils = require(__dirname + '/../lib/utils');
var Entities = require('html-entities').AllHtmlEntities;
var debug = require('debug')('GLaDOS:script:urltitle');
var cheerio = require('cheerio');

module.exports = function (scriptLoader, irc) {
    var entities, getTitle, getYoutubeTitle, getImgurTitle, getRedditTitle, getVimeoTitle, getGithubTitle, get4chanTitle, getSoundcloudTitle, getBreadfishTitle, getTiwtterTitle;

    entities = new Entities();

    getTitle = function (URL, fn) {
        request.head({
            "uri": URL.href,
            "headers": {
                "User-Agent": irc.config.userAgent
            }
        }, function (error, res, body) {
            if (!error) {
                if (res.statusCode === 200) {
                    if (res.headers.hasOwnProperty('content-type') && res.headers['content-type'].indexOf('text/html') > -1) {
                        request({
                            "uri": URL.href,
                            "headers": {
                                "User-Agent": irc.config.userAgent
                            }
                        }, function (error, res, body) {
                            if (!error) {
                                if (res.statusCode === 200) {
                                    var title = cheerio(body).find('title').text();
                                    if (title.length > 0) {
                                        title = title.replace(/(\r\n|\n|\r)/gm, "").trim();
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
        } else if (URL.hostname === 'y2u.be' || URL.hostname === 'www.y2u.be') {
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
        var match;
        if ((match = URL.href.match(/^(?:http|https):\/\/(?:i\.)?imgur\.com\/([A-Za-z0-9]{2,})/i)) !== null) {
            request({
                "url": 'https://api.imgur.com/3/image/' + match[1],
                "json": true,
                "headers": {
                    "User-Agent": irc.config.userAgent,
                    "Authorization": 'Client-ID ' + irc.config.imgurKey
                }
            }, function (error, response, data) {
                //console.log(error, data);
                if (!error && response.statusCode === 200) {
                    data = data.data;
                    var title = data.title || 'null',
                        nsfw = data.nsfw ? ', NSFW' : '';
                    fn(true, 'Imgur: ' + title + ' [' + data.width + 'x' + data.height + ', ' + utils.readableNumber(data.size) + nsfw + ']');
                } else {
                    debug('[urltitle/imgur/image] %s', error, data);
                    getTitle(URL, fn);
                }
            });
        } else if ((match = URL.href.match(/^(?:http|https):\/\/imgur\.com\/a\/([A-Za-z0-9]+)/i)) !== null) {
            request({
                "url": 'https://api.imgur.com/3/album/' + match[1],
                "json": true,
                "headers": {
                    "User-Agent": irc.config.userAgent,
                    "Authorization": 'Client-ID ' + irc.config.imgurKey
                }
            }, function (error, response, data) {
                if (!error && response.statusCode === 200) {
                    data = data.data;
                    var title = data.title || 'null',
                        nsfw = data.nsfw ? ', NSFW' : '';
                    fn(true, 'Imgur Album: ' + title + ' [' + data.images_count + ' images' + nsfw + ']');
                } else {
                    debug('[urltitle/imgur/image] %s', error, data);
                    getTitle(URL, fn);
                }
            });
        }
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
                    "User-Agent": irc.config.userAgent
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
                    "User-Agent": irc.config.userAgent
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
                    "User-Agent": irc.config.userAgent
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
                    "User-Agent": irc.config.userAgent
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
                    "User-Agent": irc.config.userAgent
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
                    "User-Agent": irc.config.userAgent
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
                    "User-Agent": irc.config.userAgent
                }
            }, function (error, response, data) {
                if (!error && response.statusCode === 200) {
                    fn(true, 'GitHub Repository: ' + data.full_name + ' - ' + data.description + ' (' + data.subscribers_count + ' Watchers, ' + data.stargazers_count + ' Stargazers, ' + data.forks_count + ' Forks)');
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
                    "User-Agent": irc.config.userAgent
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

    get4chanTitle = function (URL, fn) {
        //http://boards.4chan.org/b/
        //http://boards.4chan.org/b/res/540960782
        //http://boards.4chan.org/b/res/540960782#p123456789
        var match;
        if ((match = URL.href.match(/^(?:http|https):\/\/boards\.4chan\.org\/([a-zA-Z0-9]*)\/thread\/([0-9]*)(?:\/?)$/i)) !== null) {
            request({
                "uri": 'https://a.4cdn.org/' + match[1] + '/res/' + match[2] + '.json',
                "json": true,
                "headers": {
                    "User-Agent": irc.config.userAgent
                }
            }, function (error, response, data) {
                if (!error && response.statusCode === 200) {
                    var msg = data.posts[0].com || null;
                    if (msg !== null) {
                        msg = cheerio("<div/>").html(msg).text();
                        if (msg.length > 100) {
                            msg = msg.substr(0, 100) + '...';
                        }
                    }
                    fn(true, '4chan: ' + msg + ' - /' + match[1] + '/ - ' + data.posts.length + ' replies');
                } else {
                    debug('[urltitle/4chan/res] %s', error);
                    getTitle(URL, fn);
                }
            });
        }
    };

    getSoundcloudTitle = function (URL, fn) {
        var match = URL.href.match(/(https?:\/\/(www\.)?soundcloud\.com\/)([\d\w\-\/]+)/i);
        request({
            "uri": 'http://api.soundcloud.com/resolve.json?client_id=' + irc.config.soundcloudKey + '&url=' + match[0],
            "json": true,
            "headers": {
                "User-Agent": irc.config.userAgent
            }
        }, function (error, response, data) {
            if (!error && response.statusCode === 200) {
                if (data.kind === 'track') {
                    fn(true, 'Soundcloud track: ' + data.title + ' - by ' + data.user.username + ' - ' + utils.formatTime(data.duration / 1000));
                } else if (data.kind === 'playlist') {
                    fn(true, 'Soundcloud playlist: ' + data.title + ' - ' + data.track_count + ' tracks - by ' + data.user.username + ' - ' + utils.formatTime(data.duration / 1000));
                } else {
                    getTitle(URL, fn);
                }
            } else {
                debug('[urltitle/soundcloud] %s', error);
                getTitle(URL, fn);
            }
        });
    };

    getBreadfishTitle = function (URL, fn) {
        request({
            "uri": URL.href,
            "headers": {
                "User-Agent": irc.config.userAgent
            }
        }, function (error, res, body) {
            if (!error) {
                if (res.statusCode === 200) {
                    if (!res.headers.hasOwnProperty('content-type') || res.headers['content-type'].indexOf('text/html') !== 0) {
                        return getTitle(URL, fn);
                    }
                    var title = cheerio(body).find('title').text();
                    if (title.length > 0) {
                        title = title.replace(/(\r\n|\n|\r)/gm, "").replace(/\s{2,}/g, ' ').trim();
                        fn(true, 'Breadfish: ' + entities.decode(title).replace(/ - breadfish\.de - DIE deutschsprachige GTA-Community$/, ''));
                    }
                } else {
                    getTitle(URL, fn);
                }
            } else {
                debug('[urltitle/breadfish] %s', error);
                getTitle(URL, fn);
            }
        });
    };

    getTiwtterTitle = function (URL, fn) {
        var match;
        if ((match = URL.href.match(/^(?:http|https):\/\/twitter\.com\/(?:\w){1,15}\/status\/([0-9]+)(?:\/?)/i) || URL.href.match(/^(?:http|https):\/\/twitter\.com\/(?:\w){1,15}\/status\/([0-9]+)(?:\/photo\/[0-9]+?)(?:\/?)/i)) !== null) {
            request({
                "uri": 'http://noauth.jit.su/1/statuses/show.json?id=' + match[1],
                "json": true,
                "headers": {
                    "User-Agent": irc.config.userAgent
                }
            }, function (error, response, data) {
                if (!error && response.statusCode === 200) {
                    fn(true, 'Twitter: @' + data.user.screen_name + ': ' + data.text);
                } else {
                    debug('[urltitle/twitter/status] %s', error);
                    getTitle(URL, fn);
                }
            });
        }
    };

    scriptLoader.registerEvent('message', function (event) {
        var URL, match;
        if ((match = event.message.match(/(http|ftp|https):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@?\^=%&amp;:\/~\+#]*[\w\-\@?\^=%&amp;\/~\+#])?/i)) !== null) {
            URL = url.parse(match[0], true, true);

            if (_.indexOf(['youtube.com', 'www.youtube.com', 'youtu.be', 'www.youtu.be', 'www.y2u.be', 'y2u.be'], URL.hostname) !== -1) {
                getYoutubeTitle(URL, function (success, title) {
                    if (success) {
                        event.channel.say(title);
                    }
                });
            } else if (_.indexOf(['i.imgur.com', 'www.i.imgur.com', 'imgur.com', 'www.imgur.com'], URL.hostname) !== -1) { /* Imgur URL */
                getImgurTitle(URL, function (success, title) {
                    if (success) {
                        event.channel.say(title);
                    }
                });
            } else if (_.indexOf(['vimeo.com', 'www.vimeo.com'], URL.hostname) !== -1) { /* Vimeo URL */
                getVimeoTitle(URL, function (success, title) {
                    if (success) {
                        event.channel.say(title);
                    }
                });
            } else if (_.indexOf(['reddit.com', 'redd.it', 'www.reddit.com', 'www.redd.it'], URL.hostname) !== -1) { /* Reddit URL */
                getRedditTitle(URL, function (success, title) {
                    if (success) {
                        event.channel.say(title);
                    }
                });
            } else if (_.indexOf(['github.com', 'www.github.com', 'gist.github.com', 'www.gist.github.com'], URL.hostname) !== -1) { /* Github URL */
                getGithubTitle(URL, function (success, title) {
                    if (success) {
                        event.channel.say(title);
                    }
                });
            } else if (_.indexOf(['4chan.org', 'boards.4chan.org'], URL.hostname) !== -1) { /* 4chan URL */
                get4chanTitle(URL, function (success, title) {
                    if (success) {
                        event.channel.say(title);
                    }
                });
            } else if (_.indexOf(['soundcloud.com'], URL.hostname) !== -1) { /* souncloud URL */
                getSoundcloudTitle(URL, function (success, title) {
                    if (success) {
                        event.channel.say(title);
                    }
                });
            } else if (_.indexOf(['sa-mp.de', 'forum.sa-mp.de'], URL.hostname) !== -1) { /* Breadfish URL */
                getBreadfishTitle(URL, function (success, title) {
                    if (success) {
                        event.channel.say(title);
                    }
                });
            } else if (_.indexOf(['twitter.com'], URL.hostname) !== -1) { /* Twitter URL */
                getTiwtterTitle(URL, function (success, title) {
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
        } else if ((match = event.message.match(/(?:spotify)\:(artist|album|track)\:(.+)/i)) !== null) {
            if (match[1] === 'artist') {
                request({
                    "url": 'http://ws.spotify.com/lookup/1/.json?uri=spotify:artist:' + match[2] + '&extras=album',
                    "json": true,
                    "headers": {
                        "User-Agent": irc.config.userAgent
                    }
                }, function (error, response, data) {
                    if (!error && response.statusCode === 200) {
                        event.channel.say(irc.clrs('Spotify: {B}{C}' + data.artist.name + '{R} (' + data.artist.albums.length + ' albums).'));
                    } else {
                        debug('[urltitle/spotify/artist] %s', error);
                    }
                });
            } else if (match[1] === 'album') {
                request({
                    "url": 'http://ws.spotify.com/lookup/1/.json?uri=spotify:album:' + match[2] + '&extras=track',
                    "json": true,
                    "headers": {
                        "User-Agent": irc.config.userAgent
                    }
                }, function (error, response, data) {
                    if (!error && response.statusCode === 200) {
                        event.channel.say(irc.clrs('Spotify: {B}{O}' + data.album.name + '{R} by {B}{C}' + data.album.artist + '{R}. ' + data.album.tracks.length + ' tracks, released ' + data.album.released + '.'));
                    } else {
                        debug('[urltitle/spotify/album] %s', error);
                    }
                });
            } else if (match[1] === 'track') {
                request({
                    "url": 'http://ws.spotify.com/lookup/1/.json?uri=spotify:track:' + match[2],
                    "json": true,
                    "headers": {
                        "User-Agent": irc.config.userAgent
                    }
                }, function (error, response, data) {
                    if (!error && response.statusCode === 200) {
                        var artistStr = '', time, artists = _.map(data.track.artists, function (artist) {
                            return artist.name;
                        });
                        if (artists.length > 1) {
                            artistStr = ' & ' + artists.pop();
                            artistStr = artists.join(', ') + artistStr;
                        } else {
                            artistStr = artists[0];
                        }
                        time = utils.formatTime(Math.round(data.track.length));
                        event.channel.say(irc.clrs('Spotify: {B}{C}' + artistStr + ' - ' + data.track.name + '{R} (Track No. ' + data.track['track-number'] + ' on {B}{O}' + data.track.album.name + '{R}) [' + time + ']'));
                    } else {
                        debug('[urltitle/spotify/track] %s', error);
                    }
                });
            }
        }
    });
};