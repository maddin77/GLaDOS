/*jshint camelcase: false */
var url         = require('url');
var request     = require('request');
var _           = require('underscore')._;
var utils       = require(__dirname + '/../lib/utils');
var Entities    = require('html-entities').AllHtmlEntities;
var cheerio     = require('cheerio');
var ircC        = require('irc-colors');

module.exports = function (scriptLoader) {
    var database, entities, getTitle, getYoutubeTitle, getImgurTitle, getRedditTitle, getVimeoTitle, getGithubTitle, get4chanTitle, getSoundcloudTitle, getBreadfishTitle, getTiwtterTitle;

    entities = new Entities();

    database                = scriptLoader.database('urltitle');
    database.imgurkey       = database.imgurkey || '';
    database.soundcloudkey  = database.soundcloudkey || '';
    database.useragent      = database.useragent || scriptLoader.connection.config.userAgent;
    database.disabled       = database.disabled || {};
    database.save();

    scriptLoader.on('command', ['urltitle'], function (event) {
        if (event.user.isAdmin()) {
            var chan = event.channel.getName(),
                net = event.channel.connection.config.id;
            if (_.has(database.disabled, net)) {
                if (database.disabled[net].indexOf(chan) > -1) {
                    database.disabled[net] = _.without(database.disabled[net], chan);
                    if (database.disabled[net].length === 0) {
                        delete database.disabled[net];
                    }
                    event.user.notice('urltitle enabled for %s on %s', chan, net);
                } else {
                    database.disabled[net].push(chan);
                    event.user.notice('urltitle disabled for %s on %s', chan, net);
                }
            } else {
                database.disabled[net] = [chan];
                event.user.notice('urltitle disabled for %s on %s', chan, net);
            }
            database.save();
        } else {
            event.user.notice('You don\'t have the permissions to use this command.');
        }
    });

    getTitle = function (URL, fn) {
        request.head({
            'uri': URL.href,
            'headers': {
                'User-Agent': database.useragent
            }
        }, function (error, res) {
            if (!error) {
                if (res.statusCode === 200) {
                    if (res.headers.hasOwnProperty('content-type') && res.headers['content-type'].indexOf('text/html') > -1) {
                        request({
                            'uri': URL.href,
                            'headers': {
                                'User-Agent': database.useragent
                            }
                        }, function (error, res, body) {
                            if (!error) {
                                if (res.statusCode === 200) {
                                    var title = cheerio(body).find('title').text();
                                    if (title.length > 0) {
                                        title = title.replace(/(\r\n|\n|\r)/gm, '').trim();
                                        fn(true, 'Title: ' + entities.decode(title) + ' (at ' + URL.host + ')');
                                    }
                                } else {
                                    fn(false, null);
                                }
                            } else {
                                scriptLoader.debug('[urltitle/*] %s', error);
                                fn(false, null);
                            }
                        });
                    }
                } else {
                    fn(false, null);
                }
            } else {
                scriptLoader.debug('[*] %s', error);
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
                'url': 'http://gdata.youtube.com/feeds/api/videos/' + videoID + '?v=2&alt=json',
                'json': true,
                'headers': {
                    'User-Agent': database.useragent
                }
            }, function (error, response, data) {
                if (!error && response.statusCode === 200) {
                    var entry = data.entry,
                        title = entry.title.$t,
                        time = entry.media$group.yt$duration.seconds === '0' ? 'LIVE' : utils.formatTime(entry.media$group.yt$duration.seconds);
                    fn(true, 'YouTube: ' + title + ' [' + time + ']');
                } else {
                    scriptLoader.debug('[youtube] %s', error);
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
                'url': 'https://api.imgur.com/3/image/' + match[1],
                'json': true,
                'headers': {
                    'User-Agent': database.useragent,
                    'Authorization': 'Client-ID ' + database.imgurkey
                }
            }, function (error, response, data) {
                //console.log(error, data);
                if (!error && response.statusCode === 200) {
                    data = data.data;
                    var title = data.title || 'null',
                        nsfw = data.nsfw ? ', NSFW' : '';
                    fn(true, 'Imgur: ' + title + ' [' + data.width + 'x' + data.height + ', ' + utils.readableNumber(data.size) + nsfw + ']');
                } else {
                    scriptLoader.debug('[imgur/image] %s', error, data);
                    getTitle(URL, fn);
                }
            });
        } else if ((match = URL.href.match(/^(?:http|https):\/\/imgur\.com\/a\/([A-Za-z0-9]+)/i)) !== null) {
            request({
                'url': 'https://api.imgur.com/3/album/' + match[1],
                'json': true,
                'headers': {
                    'User-Agent': database.useragent,
                    'Authorization': 'Client-ID ' + database.imgurkey
                }
            }, function (error, response, data) {
                if (!error && response.statusCode === 200) {
                    data = data.data;
                    var title = data.title || 'null',
                        nsfw = data.nsfw ? ', NSFW' : '';
                    fn(true, 'Imgur Album: ' + title + ' [' + data.images_count + ' images' + nsfw + ']');
                } else {
                    scriptLoader.debug('[imgur/image] %s', error, data);
                    getTitle(URL, fn);
                }
            });
        }
    };
    getVimeoTitle = function (URL, fn) {
        var videoId = URL.pathname.substr(1);
        request({
            'url': 'http://vimeo.com/api/v2/video/' + videoId + '.json',
            'json': true,
            'headers': {
                'User-Agent': database.useragent
            }
        }, function (error, response, data) {
            if (!error && response.statusCode === 200) {
                var title = data[0].title,
                    time = utils.formatTime(data[0].duration);
                fn(true, 'Vimeo: ' + title + ' [' + time + ']');
            } else {
                scriptLoader.debug('[vimeo] %s', error);
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
                id = URL.pathname.split('/')[4] || null;
            }
            request({
                'uri': 'http://www.reddit.com/comments/' + id + '.json',
                'json': true,
                'headers': {
                    'User-Agent': database.useragent
                }
            }, function (error, response, data) {
                if (!error && response.statusCode === 200) {
                    if (data instanceof Array) {
                        data = data[0];
                    }
                    data = data.data.children[0].data;
                    fn(true, 'Reddit: ' + data.title + ' - /r/' + data.subreddit + ' - Score: ' + data.score + ' (↑' + Math.round(data.upvote_ratio * data.score) + ', ↓' + Math.round((1 - data.upvote_ratio) * data.score) + ')');
                } else {
                    scriptLoader.debug('[reddit/thread] %s', error);
                    getTitle(URL, fn);
                }
            });
        } else if (URL.path.match(/^\/(?:r)\/([a-z0-9][a-z0-9_]{2,20})(?:\/?)$/i)) { //subreddit
            id = URL.pathname.split('/')[2];
            request({
                'uri': 'http://www.reddit.com/r/' + id + '/about.json',
                'json': true,
                'headers': {
                    'User-Agent': database.useragent
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
                    scriptLoader.debug('[reddit/subreddit] %s', error);
                    getTitle(URL, fn);
                }
            });
        } else if (URL.path.match(/^\/(?:user|u)\/([_a-zA-Z0-9\-]{3,20})(?:\/?)$/i)) { //subreddit
            id = URL.pathname.split('/')[2];
            request({
                'uri': 'http://www.reddit.com/user/' + id + '/about.json',
                'json': true,
                'headers': {
                    'User-Agent': database.useragent
                }
            }, function (error, response, data) {
                if (!error && response.statusCode === 200) {
                    data = data.data;
                    fn(true, 'Reddit: /u/' + data.name + '/ - Link Karma: ' + data.link_karma + ' - Comment Karma: ' + data.comment_karma);
                } else {
                    scriptLoader.debug('[reddit/user] %s', error);
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
                'uri': 'https://api.github.com/gists/' + match[1],
                'json': true,
                'headers': {
                    'User-Agent': database.useragent
                }
            }, function (error, response, data) {
                if (!error && response.statusCode === 200) {
                    fn(true, 'GitHub Gists: ' + data.description + ' (' + data.comments + ' Comments, ' + data.forks.length + ' Forks) - by ' + data.user.login);
                } else {
                    scriptLoader.debug('[github/gist] %s', error);
                    getTitle(URL, fn);
                }
            });
        } else if ((match = URL.href.match(/^(?:http|https):\/\/github\.com\/([_a-zA-Z0-9\-]+)\/([_a-zA-Z0-9\-]+)\/issues\/([0-9]+)(?:\/?)/i)) !== null) {
            request({
                'uri': 'https://api.github.com/repos/' + match[1] + '/' + match[2] + '/issues/' + match[3],
                'json': true,
                'headers': {
                    'User-Agent': database.useragent
                }
            }, function (error, response, data) {
                if (!error && response.statusCode === 200) {
                    fn(true, 'GitHub Issues: ' + data.title + ' (Issue #' + data.number + ', ' + data.comments + ' Comments) - in ' + match[1] + '/' + match[2] + ' - by ' + data.user.login);
                } else {
                    scriptLoader.debug('[github/issues] %s', error);
                    getTitle(URL, fn);
                }
            });
        } else if ((match = URL.href.match(/^(?:http|https):\/\/github\.com\/([_a-zA-Z0-9\-]+)\/([_a-zA-Z0-9\-]+)\/pull\/([0-9]+)(?:\/?)/i)) !== null) {
            request({
                'uri': 'https://api.github.com/repos/' + match[1] + '/' + match[2] + '/pulls/' + match[3],
                'json': true,
                'headers': {
                    'User-Agent': database.useragent
                }
            }, function (error, response, data) {
                if (!error && response.statusCode === 200) {
                    fn(true, 'GitHub Pull Request: ' + data.title + ' (Pull Request #' + data.number + ', ' + data.comments + ' Comments) - in ' + match[1] + '/' + match[2] + ' - by ' + data.user.login);
                } else {
                    scriptLoader.debug('[github/pulls] %s', error);
                    getTitle(URL, fn);
                }
            });
        } else if ((match = URL.href.match(/^(?:http|https):\/\/github\.com\/([_a-zA-Z0-9\-]+)\/([_a-zA-Z0-9\-]+)(?:\/?)/i)) !== null) {
            request({
                'uri': 'https://api.github.com/repos/' + match[1] + '/' + match[2],
                'json': true,
                'headers': {
                    'User-Agent': database.useragent
                }
            }, function (error, response, data) {
                if (!error && response.statusCode === 200) {
                    fn(true, 'GitHub Repository: ' + data.full_name + ' - ' + data.description + ' (' + data.subscribers_count + ' Watchers, ' + data.stargazers_count + ' Stargazers, ' + data.forks_count + ' Forks)');
                } else {
                    scriptLoader.debug('[github/repos] %s', error);
                    getTitle(URL, fn);
                }
            });
        } else if ((match = URL.href.match(/^(?:http|https):\/\/github\.com\/([_a-zA-Z0-9\-]+)(?:\/?)$/i)) !== null) {
            request({
                'uri': 'https://api.github.com/users/' + match[1],
                'json': true,
                'headers': {
                    'User-Agent': database.useragent
                }
            }, function (error, response, data) {
                if (!error && response.statusCode === 200) {
                    fn(true, 'GitHub User: ' + data.login + ' - ' + data.name + ' (' + data.followers + ' Followers, ' + data.public_repos + ' Repositorys, ' + data.public_gists + ' Gists)');
                } else {
                    scriptLoader.debug('[github/users] %s', error);
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
                'uri': 'https://a.4cdn.org/' + match[1] + '/res/' + match[2] + '.json',
                'json': true,
                'headers': {
                    'User-Agent': database.useragent
                }
            }, function (error, response, data) {
                if (!error && response.statusCode === 200) {
                    var msg = data.posts[0].com || null;
                    if (msg !== null) {
                        msg = cheerio('<div/>').html(msg).text();
                        if (msg.length > 100) {
                            msg = msg.substr(0, 100) + '...';
                        }
                    }
                    fn(true, '4chan: ' + msg + ' - /' + match[1] + '/ - ' + data.posts.length + ' replies');
                } else {
                    scriptLoader.debug('[4chan] %s', error);
                    getTitle(URL, fn);
                }
            });
        }
    };

    getSoundcloudTitle = function (URL, fn) {
        var match = URL.href.match(/(https?:\/\/(www\.)?soundcloud\.com\/)([\d\w\-\/]+)/i);
        request({
            'uri': 'http://api.soundcloud.com/resolve.json?client_id=' + database.soundcloudkey + '&url=' + match[0],
            'json': true,
            'headers': {
                'User-Agent': database.useragent
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
                scriptLoader.debug('[soundcloud] %s', error);
                getTitle(URL, fn);
            }
        });
    };

    getBreadfishTitle = function (URL, fn) {
        request({
            'uri': URL.href,
            'headers': {
                'User-Agent': database.useragent
            }
        }, function (error, res, body) {
            if (!error) {
                if (res.statusCode === 200) {
                    if (!res.headers.hasOwnProperty('content-type') || res.headers['content-type'].indexOf('text/html') !== 0) {
                        return getTitle(URL, fn);
                    }
                    var title = cheerio(body).find('title').text();
                    if (title.length > 0) {
                        title = title.replace(/(\r\n|\n|\r)/gm, '').replace(/\s{2,}/g, ' ').trim();
                        fn(true, 'Breadfish: ' + entities.decode(title).replace(/ - breadfish\.de - DIE deutschsprachige GTA-Community$/, ''));
                    }
                } else {
                    getTitle(URL, fn);
                }
            } else {
                scriptLoader.debug('[breadfish] %s', error);
                getTitle(URL, fn);
            }
        });
    };

    getTiwtterTitle = function (URL, fn) {
        var match;
        if ((match = URL.href.match(/^(?:http|https):\/\/twitter\.com\/(?:\w){1,15}\/status\/([0-9]+)(?:\/?)/i) || URL.href.match(/^(?:http|https):\/\/twitter\.com\/(?:\w){1,15}\/status\/([0-9]+)(?:\/photo\/[0-9]+?)(?:\/?)/i)) !== null) {
            request({
                'uri': 'http://noauth.jit.su/1/statuses/show.json?id=' + match[1],
                'json': true,
                'headers': {
                    'User-Agent': database.useragent
                }
            }, function (error, response, data) {
                if (!error && response.statusCode === 200) {
                    fn(true, 'Twitter: @' + data.user.screen_name + ': ' + data.text);
                } else {
                    scriptLoader.debug('[twitter/status] %s', error);
                    getTitle(URL, fn);
                }
            });
        }
    };

    scriptLoader.on('message', function (event) {
        var chan = event.channel.getName(),
            net = event.channel.connection.config.id;
        if (_.has(database.disabled, net) && database.disabled[net].indexOf(chan) > -1) {
            return;
        }
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
                    'url': 'http://ws.spotify.com/lookup/1/.json?uri=spotify:artist:' + match[2] + '&extras=album',
                    'json': true,
                    'headers': {
                        'User-Agent': database.useragent
                    }
                }, function (error, response, data) {
                    if (!error && response.statusCode === 200) {
                        event.channel.say('Spotify: %s (%s albums).', ircC.cyan.bold(data.artist.name), data.artist.albums.length);
                    } else {
                        scriptLoader.debug('[spotify/artist] %s', error);
                    }
                });
            } else if (match[1] === 'album') {
                request({
                    'url': 'http://ws.spotify.com/lookup/1/.json?uri=spotify:album:' + match[2] + '&extras=track',
                    'json': true,
                    'headers': {
                        'User-Agent': database.useragent
                    }
                }, function (error, response, data) {
                    if (!error && response.statusCode === 200) {
                        event.channel.say('Spotify: %s by %s. %s tracks, released %s.',
                            ircC.olive.bold(data.album.name),
                            ircC.cyan.bold(data.album.artist),
                            data.album.tracks.length,
                            data.album.released
                            );
                    } else {
                        scriptLoader.debug('[urltitle/spotify/album] %s', error);
                    }
                });
            } else if (match[1] === 'track') {
                request({
                    'url': 'http://ws.spotify.com/lookup/1/.json?uri=spotify:track:' + match[2],
                    'json': true,
                    'headers': {
                        'User-Agent': database.useragent
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
                        event.channel.say('Spotify: %s (Track No. %s on %s) [%s]',
                            ircC.cyan.bold(artistStr + ' - ' + data.track.name),
                            data.track['track-number'],
                            ircC.olive.bold(data.track.album.name),
                            time
                            );
                    } else {
                        scriptLoader.debug('[urltitle/spotify/track] %s', error);
                    }
                });
            }
        }
    });
};
