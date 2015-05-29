/*jshint camelcase: false */
var Entities    = require('html-entities').AllHtmlEntities;
var urlRegex    = require('url-regex');
var numeral     = require('numeral');
var cheerio     = require('cheerio');
var _           = require('lodash');
var async       = require('async');
var util        = require('util');
var moment      = require('moment');
var Url         = require('url');

exports.register = function (glados, next) {
    var entities = new Entities();
    var database = glados.brain('urltitle');

    var request = require('request').defaults({
        headers: {
            'User-Agent': glados.config.object.userAgent,
            'Accept-Language': glados.config.object.requestLanguage
        },
        timeout: 5000
    });

    var isDisabled = function (channel) {
        var disabled = database.object.disabled;
        if (_.isArray(disabled)) {
            return disabled.indexOf(channel) !== -1;
        }
        database.object.disabled = [];
        database.save();
        return false;
    };
    var toggleDisable = function (channel) {
        if (isDisabled(channel)) {
            database.object.disabled = _.without(database.object.disabled, channel);
            database.save();
            return true;
        } else {
            database.object.disabled.push(channel);
            database.save();
            return false;
        }
    };

    var website = function (url, callback) {
        request.head({
            'uri': url.href
        }, function (error, res) {
            if (error) {
                glados.debug('[website] %s', error);
                return callback(error);
            }
            if (res.statusCode !== 200) {
                return callback('Status !== 200');
            }
            if (!res.headers.hasOwnProperty('content-type') || res.headers['content-type'].indexOf('text/html') === -1) {
                return callback('content-type != text/html');
            }
            request({
                'uri': url.href
            }, function (error, res, body) {
                if (error) {
                    glados.debug('[website] %s', error);
                    return callback(error);
                }
                if (res.statusCode !== 200) {
                    return callback('Status !== 200');
                }
                var title = cheerio(body).find('title').first().text();
                if (title.length > 0) {
                    title = title.replace(/(\r\n|\n|\r)/gm, '').trim();
                    callback(null, 'Title: ' + entities.decode(title) + ' (at ' + url.host + ')');
                }
            });
        });
    };


    /*var youtube = function (url, callback) {
        var videoID = null;
        if (url.hostname === 'youtube.com' || url.hostname === 'www.youtube.com') {
            videoID = url.query.v;
        } else if (url.hostname === 'youtu.be' || url.hostname === 'www.youtu.be') {
            videoID = url.pathname.substr(1);
        } else if (url.hostname === 'y2u.be' || url.hostname === 'www.y2u.be') {
            videoID = url.pathname.substr(1);
        }
        if (!videoID) {
            return callback(url);
        }

        request({
            'url': 'https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet&id=' + videoID + '&key=' + glados.config.object.AUTH['goo.gl'],
            'json': true
        }, function (error, response, data) {
            if (!error && response.statusCode === 200 && data.items.length > 0) {
                var seconds = moment.duration(data.items[0].contentDetails.duration).asSeconds();
                return callback(util.format('YouTube: %s [%s]',
                    data.items[0].snippet.title,
                    seconds === '0' ? 'LIVE' : numeral(~~seconds).format('00:00:00')
                ));
            } else {
                glados.debug('[youtube] %s', error);
                return callback(url);
            }
        });
    };
    var imgur = function (url, callback) {
        var match;
        if ((match = url.href.match(/^(?:http|https):\/\/(?:i\.)?imgur\.com\/([A-Za-z0-9]{2,})/i)) !== null) {
            request({
                'url': 'https://api.imgur.com/3/image/' + match[1],
                'json': true,
                'headers': {
                    'Authorization': 'Client-ID ' + glados.config.object.AUTH.imgur
                }
            }, function (error, response, data) {
                console.log(error, data);
                if (!error && response.statusCode === 200) {
                    return callback(util.format('Imgur: %s [%sx%s, %s%s]',
                        data.data.title || 'null',
                        data.data.width,
                        data.data.height,
                        numeral(data.data.size).format('0.0b'),
                        data.data.nsfw ? ', NSFW' : ''
                    ));
                } else {
                    glados.debug('[imgur/image] %s', error, data);
                    return callback(url);
                }
            });
        } else if ((match = url.href.match(/^(?:http|https):\/\/imgur\.com\/a\/([A-Za-z0-9]+)/i)) !== null) {
            request({
                'url': 'https://api.imgur.com/3/album/' + match[1],
                'json': true,
                'headers': {
                    'Authorization': 'Client-ID ' + glados.config.object.AUTH.imgur
                }
            }, function (error, response, data) {
                if (!error && response.statusCode === 200) {
                    return callback(util.format('Imgur Album: %s [%s Bilder%s]',
                        data.data.title || 'null',
                        data.data.images_count,
                        data.data.nsfw ? ', NSFW' : ''
                    ));
                } else {
                    glados.debug('[imgur/image] %s', error, data);
                    return callback(url);
                }
            });
        } else {
            return callback(url);
        }
    };
    var vimeo = function (url, callback) {
        var videoId = url.pathname.substr(1);
        request({
            'url': 'http://vimeo.com/api/v2/video/' + videoId + '.json',
            'json': true
        }, function (error, response, data) {
            if (!error && response.statusCode === 200) {
                return callback(util.format('Vimeo: %s [%s]',
                    data[0].title,
                    numeral(data[0].duration).format('00:00:00')
                ));
            } else {
                glados.debug('[vimeo] %s', error);
                return callback(url);
            }
        });
    };
    var reddit = function (url, callback) {
        var id;
        if (url.hostname === 'redd.it' || url.hostname === 'www.redd.it' || url.path.match(/^\/(?:r)\/([a-z0-9][a-z0-9_]{2,20})\/(?:comments)\/([a-z0-9]+)\/(?:.+)\/?$/i)) { //reddit Thread
            if (url.hostname === 'redd.it' || url.hostname === 'www.redd.it') {
                id = url.pathname.substr(1) || null;
            } else {
                id = url.pathname.split('/')[4] || null;
            }
            request({
                'uri': 'http://www.reddit.com/comments/' + id + '.json',
                'json': true
            }, function (error, response, data) {
                if (!error && response.statusCode === 200) {
                    if (data instanceof Array) {
                        data = data[0];
                    }
                    data = data.data.children[0].data;
                    return callback(util.format('Reddit: %s - /r/%s - %s Punkte (%s) - %s Kommentare',
                        data.title,
                        data.subreddit,
                        numeral(data.score).format('0,0'),
                        data.upvote_ratio,
                        numeral(data.num_comments).format('0,0')
                    ));
                } else {
                    glados.debug('[reddit/thread] %s', error);
                    return callback(url);
                }
            });
        } else if (url.path.match(/^\/(?:r)\/([a-z0-9][a-z0-9_]{2,20})(?:\/?)$/i)) { //subreddit
            id = url.pathname.split('/')[2];
            request({
                'uri': 'http://www.reddit.com/r/' + id + '/about.json',
                'json': true
            }, function (error, response, data) {
                if (!error && response.statusCode === 200) {
                    data = data.data;
                    return callback(util.format('Reddit: %s - %s - %s Subscribers',
                        data.title.replace(/(\r\n|\n|\r)/gm, ''),
                        _.unescape(data.public_description),
                        numeral(data.subscribers).format('0,0')
                    ));
                } else {
                    glados.debug('[reddit/subreddit] %s', error);
                    return callback(url);
                }
            });
        } else if (url.path.match(/^\/(?:user|u)\/([_a-zA-Z0-9\-]{3,20})(?:\/?)$/i)) { //subreddit
            id = url.pathname.split('/')[2];
            request({
                'uri': 'http://www.reddit.com/user/' + id + '/about.json',
                'json': true
            }, function (error, response, data) {
                if (!error && response.statusCode === 200) {
                    data = data.data;
                    return callback(util.format('Reddit: /u/%s - Link Karma: %s - Comment Karma: %s',
                        data.name,
                        numeral(data.link_karma).format('0,0'),
                        numeral(data.comment_karma).format('0,0')
                    ));
                } else {
                    glados.debug('[reddit/user] %s', error);
                    return callback(url);
                }
            });
        } else {
            return callback(url);
        }
    };
    var github = function (url, callback) {
        var match;
        if ((match = url.href.match(/^(?:http|https):\/\/gist\.github\.com\/(?:[A-Za-z0-9]+)\/([A-Za-z0-9]+)(?:\/?)$/i)) !== null) {
            request({
                'uri': 'https://api.github.com/gists/' + match[1],
                'json': true
            }, function (error, response, data) {
                if (!error && response.statusCode === 200) {
                    return callback(util.format('GitHub Gists: %s - von %s (%s Kommentare, %s Forks)',
                        data.description,
                        data.owner.login,
                        data.comments,
                        data.forks.length
                    ));
                } else {
                    glados.debug('[github/gist] %s', error);
                    return callback(url);
                }
            });
        } else if ((match = url.href.match(/^(?:http|https):\/\/github\.com\/([_a-zA-Z0-9\-]+)\/([_a-zA-Z0-9\-]+)\/issues\/([0-9]+)(?:\/?)/i)) !== null) {
            request({
                'uri': 'https://api.github.com/repos/' + match[1] + '/' + match[2] + '/issues/' + match[3],
                'json': true
            }, function (error, response, data) {
                if (!error && response.statusCode === 200) {
                    return callback(util.format('GitHub Issues: "%s - von %s - in %s (#%s, %s Kommentare)',
                        data.title,
                        data.user.login,
                        match[1] + '/' + match[2],
                        data.number,
                        data.comments
                    ));
                } else {
                    glados.debug('[github/issues] %s', error);
                    return callback(url);
                }
            });
        } else if ((match = url.href.match(/^(?:http|https):\/\/github\.com\/([_a-zA-Z0-9\-]+)\/([_a-zA-Z0-9\-]+)\/pull\/([0-9]+)(?:\/?)/i)) !== null) {
            request({
                'uri': 'https://api.github.com/repos/' + match[1] + '/' + match[2] + '/pulls/' + match[3],
                'json': true
            }, function (error, response, data) {
                if (!error && response.statusCode === 200) {
                    return callback(util.format('GitHub Pull Request: %s - von %s - in %s (#%s, %s Kommentare)',
                        data.title,
                        data.user.login,
                        match[1] + '/' + match[2],
                        data.number,
                        data.comments
                    ));
                } else {
                    glados.debug('[github/pulls] %s', error);
                    return callback(url);
                }
            });
        } else if ((match = url.href.match(/^(?:http|https):\/\/github\.com\/([_a-zA-Z0-9\-]+)\/([_a-zA-Z0-9\-]+)(?:\/?)/i)) !== null) {
            request({
                'uri': 'https://api.github.com/repos/' + match[1] + '/' + match[2],
                'json': true
            }, function (error, response, data) {
                if (!error && response.statusCode === 200) {
                    return callback(util.format('GitHub Repository: %s - %s (%s Watchers, %s Stargazers, %s Forks)',
                        data.full_name,
                        data.description,
                        data.subscribers_count,
                        data.stargazers_count,
                        data.forks_count
                    ));
                } else {
                    glados.debug('[github/repos] %s', error);
                    return callback(url);
                }
            });
        } else if ((match = url.href.match(/^(?:http|https):\/\/github\.com\/([_a-zA-Z0-9\-]+)(?:\/?)$/i)) !== null) {
            request({
                'uri': 'https://api.github.com/users/' + match[1],
                'json': true
            }, function (error, response, data) {
                if (!error && response.statusCode === 200) {
                    return callback(util.format('GitHub User: %s - %s (%s Followers, %s Repositorys, %s Gists)',
                        data.login,
                        data.name,
                        data.followers,
                        data.public_repos,
                        data.public_gists
                    ));
                } else {
                    glados.debug('[github/users] %s', error);
                    return callback(url);
                }
            });
        } else {
            return callback(url);
        }
    };
    var halfchan = function (url, callback) {
        var match;
        if ((match = url.href.match(/^(?:http|https):\/\/boards\.4chan\.org\/([a-zA-Z0-9]*)\/thread\/([0-9]*)(?:\/?)$/i)) !== null) {
            request({
                'uri': 'https://a.4cdn.org/' + match[1] + '/res/' + match[2] + '.json',
                'json': true
            }, function (error, response, data) {
                if (!error && response.statusCode === 200) {
                    var msg = data.posts[0].com || null;
                    if (msg !== null) {
                        msg = cheerio('<div/>').html(msg).text();
                        msg = _.trunc(msg, 100);
                    }
                    return callback(util.format('4chan: %s - /%s/ - %s Antworten',
                        msg,
                        match[1],
                        data.posts.length
                    ));
                } else {
                    glados.debug('[4chan] %s', error);
                    return callback(url);
                }
            });
        } else {
            return callback(url);
        }
    };
    var soundcloud = function (url, callback) {
        var match = url.href.match(/(https?:\/\/(www\.)?soundcloud\.com\/)([\d\w\-\/]+)/i);
        request({
            'uri': 'http://api.soundcloud.com/resolve.json?client_id=' + glados.config.object.AUTH.soundcloud + '&url=' + match[0],
            'json': true
        }, function (error, response, data) {
            if (!error && response.statusCode === 200) {
                if (data.kind === 'track') {
                    return callback(util.format('Soundcloud: %s - by %s [%s]',
                        data.title,
                        data.user.username,
                        numeral(data.duration / 1000).format('00:00:00')
                    ));
                } else if (data.kind === 'playlist') {
                    return callback(util.format('Soundcloud Playlist: %s - %s tracks - by %s [%s]',
                        data.title,
                        data.track_count,
                        data.user.username,
                        numeral(data.duration / 1000).format('00:00:00')
                    ));
                }
                return callback(url);
            } else {
                glados.debug('[soundcloud] %s', error);
                return callback(url);
            }
        });
    };
    var breadfish = function (url, callback) {
        request({
            'uri': url.href
        }, function (error, res, body) {
            if (error) {
                glados.debug('[breadfish] %s', error);
                return callback(url);
            }
            if (!res.headers.hasOwnProperty('content-type') || res.headers['content-type'].indexOf('text/html') === -1) {
                return callback(url);
            }
            var title = cheerio(body).find('title').text();
            if (title.length > 0) {
                title = title.replace(/(\r\n|\n|\r)/gm, '').replace(/\s{2,}/g, ' ').trim();
                callback('Breadfish: ' + entities.decode(title).replace(/ - breadfish\.de - DIE deutschsprachige GTA-Community$/, ''));
            }
        });
    };
    var twitter = function (url, callback) {
        var match;
        if ((match = url.href.match(/^(?:http|https):\/\/twitter\.com\/(?:\w){1,15}\/status\/([0-9]+)(?:\/?)/i) || url.href.match(/^(?:http|https):\/\/twitter\.com\/(?:\w){1,15}\/status\/([0-9]+)(?:\/photo\/[0-9]+?)(?:\/?)/i)) !== null) {
            request({
                'uri': 'http://noauth.jit.su/1/statuses/show.json?id=' + match[1],
                'json': true
            }, function (error, response, data) {
                if (!error && response.statusCode === 200) {
                    return callback(util.format('Twitter: %s - @%s',
                        data.text,
                        data.user.screen_name
                    ));
                } else {
                    glados.debug('[twitter/status] %s', error);
                    return callback(url);
                }
            });
        }
    };*/

    var getTitel = function (originalUrl, callback) {
        var url = Url.parse(originalUrl, true, true);
        /*if (_.indexOf(['youtube.com', 'www.youtube.com', 'youtu.be', 'www.youtu.be', 'www.y2u.be', 'y2u.be'], url.hostname) !== -1) {
            return youtube(url, callback);
        }
        if (_.indexOf(['i.imgur.com', 'www.i.imgur.com', 'imgur.com', 'www.imgur.com'], url.hostname) !== -1) {
            return imgur(url, callback);
        }
        if (_.indexOf(['vimeo.com', 'www.vimeo.com'], url.hostname) !== -1) {
            return vimeo(url, callback);
        }
        if (_.indexOf(['reddit.com', 'redd.it', 'www.reddit.com', 'www.redd.it'], url.hostname) !== -1) {
            return reddit(url, callback);
        }
        if (_.indexOf(['github.com', 'www.github.com', 'gist.github.com', 'www.gist.github.com'], url.hostname) !== -1) {
            return github(url, callback);
        }
        if (_.indexOf(['4chan.org', 'boards.4chan.org'], url.hostname) !== -1) {
            return halfchan(url, callback);
        }
        if (_.indexOf(['soundcloud.com'], url.hostname) !== -1) {
            return soundcloud(url, callback);
        }
        if (_.indexOf(['sa-mp.de', 'forum.sa-mp.de'], url.hostname) !== -1) {
            return breadfish(url, callback);
        }
        if (_.indexOf(['twitter.com'], url.hostname) !== -1) {
            return twitter(url, callback);
        }*/
        return callback(url, null);
    };

    glados.hear(/(http|ftp|https):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@?\^=%&amp;:\/~\+#]*[\w\-\@?\^=%&amp;\/~\+#])?/gmi, function (match, event) {
        if (isDisabled(event.channel.getName())) {
            return;
        }
        glados.debug('found urls: ', match);
        async.map(match, function (originalUrl, callback) {
            glados.debug('map->', originalUrl);
            getTitel(originalUrl, function (url, title) {
                glados.debug('getTitel->%s', title);
                if (title) {
                    return callback(null, title);
                }
                website(url, function (error, title) {
                    glados.debug('website->%s', title);
                    if (error) {
                        glados.debug('glados.hear->map->getTitel->website:', error);
                        return callback(null, null);
                    }
                    return callback(null, title);
                });
            });
        }, function (error, results) {
            if (error) {
                return glados.debug('Error getTitel: ' + error);
            }
            results = _.filter(results, function (t) {
                return !_.isNull(t);
            });
            _.each(results, function (title) {
                event.channel.say(title);
            });
        });
    });
    glados.hear(/^!urltitle$/i, function (match, event) {
        if (!event.channel.userHasMinMode(event.user, '@')) {
            return event.user.notice('Du bist nicht berechtigt diesen Befehl zu nutzen.');
        }
        event.user.notice('Urltitle wurde für %s %saktiviert.', event.channel.getName(), toggleDisable(event.channel.getName())?'':'de');
    });

    return next();
};
exports.info = {
    name: 'urltitle',
    displayName: 'Webseiten Titel',
    desc: [
        'Postet Informationen über einen Link im Channel. Folgende Seiten werden aktuell unterstützt:',
        'Youtube, Imgur, Vimeo, Reddit, GitHub, 4chan, SoundCloud, Breadfish & Twitter.',
        'Sollte der Link zu keiner der Seiten passen wird der Titel der Webseite ausgegeben.'
    ],
    version: '1.1.0',
    commands: [{
        name: 'urltitle',
        desc: [
            '(De-)Aktiviert die ausgabe des Plugins im Channel.',
            'Kann nur von Channel-Operatoren genutzt werden.'
        ]
    }],
    hear: [{
        name: 'title',
        hear: '<URL>',
        desc: ['Postet Informationen über einen Link im Channel.']
    }]
};
