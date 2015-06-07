var request = require('request');
var CronJob = require('cron').CronJob;
var async   = require('async');
var _       = require('lodash');
var ircC    = require('irc-colors');
var moment  = require('moment');
var googl   = require('goo.gl');

exports.register = function (glados, next) {
    googl.setKey(glados.config.object.AUTH['goo.gl']);


    var rssdb = glados.brain('rss');
    var feedCache = [];

    var shortLink = function (url, callback) {
        return googl.shorten(url).then(function (shortUrl) {
            return callback(shortUrl);
        }).catch(function (err) {
            glados.debug(err.message);
            return callback(url);
        });
    };

    var getFormattedFeedDb = function () {
        var feeds = {};
        _.each(rssdb.object, function (entries, reciever) {
            _.each(entries, function (entry) {
                if (!_.has(feeds, entry.url)) {
                    feeds[entry.url] = [];
                }
                feeds[entry.url].push(reciever);
            });
        });
        feeds = _.map(feeds, function (user, url) {
            return {
                user: user,
                url: url
            };
        });
        return feeds; // [{url: '', user: ['']}]
    };
    var getFeed = function (url, callback) {
        request({
            'uri': 'http://ajax.googleapis.com/ajax/services/feed/load?v=1.0&num=20&q=' + encodeURIComponent(url),
            'json': true
        }, function (err, res, data) {
            if (!err && res.statusCode === 200) {
                if (data.responseStatus === 200) {
                    return callback(data.responseData.feed);
                } else {
                    return callback(null);
                }
            } else {
                return callback(null);
            }
        });
    };
    var testRssUrl = function (url, callback) {
        getFeed(url, function (data) {
            return callback(data ? data.title : null);
        });
    };
    var getFeedEntries = function (data, onlynew) {
        onlynew = onlynew || false;
        var feedEntries = _.map(data.entries, function (e) {
            return {
                title: e.title,
                url: e.link
            };
        });
        if (onlynew) {
            feedEntries = _.filter(feedEntries, function (e) {
                return !_.includes(feedCache, e.url);
            });
        }
        return feedEntries;
    };

    var checkAllFeeds = function (alert) {
        var feeds = getFormattedFeedDb();
        async.eachSeries(feeds, function (dbentry, callback) {
            getFeed(dbentry.url, function (data) {
                var targets     = dbentry.user;
                var feedTitle   = data.title;
                var feedEntries = getFeedEntries(data, alert);

                if (!alert) {
                    _.each(feedEntries, function (feedEntry) {
                        feedCache.push(feedEntry.url);
                    });
                    return callback(null);
                }

                return async.eachSeries(feedEntries, function (feedEntry, _callback) {
                    feedCache.push(feedEntry.url);
                    return async.eachSeries(targets, function (targetName, __callback) {
                        shortLink(feedEntry.url, function (shortUrl) {
                            glados.connection.notice(targetName, '[%s] %s (%s)', feedTitle, ircC.bold(feedEntry.title), shortUrl);
                            return __callback(null);
                        });
                    }, _callback);
                }, callback);
            });
        }, function (error) {
            if (error) {
                glados.debug(error);
            }
        });
    };

    glados.hear(/^!chanrss( \S+)?( .+)?$/i, function (match, event) {
        if (!event.channel.userHasMinMode(event.user, '%')) {
            return event.user.notice('Du bist nicht berechtigt RSS Feeds für diesen Channel zu verwalten.');
        }
        var action = match[1] ? match[1].trim() : null;
        var url = match[2] ? match[2].trim() : null;
        var entry;
        if (!action) {
            return event.user.notice('Benutze: !chanrss <subscribe/unsubscribe/list> [url]');
        } else if (action.toLowerCase() === 'subscribe') {
            if (!url) {
                return event.user.notice('Benutze: !chanrss subscribe <url>');
            }
            entry = rssdb(event.channel.getName()).find({ url: url });
            if (!_.isUndefined(entry)) {
                return event.user.notice('Diese URL wurde bereits von %s am %s für diesen Channel abboniert.',
                    entry.by, moment(new Date(entry.ts)).format('DD. MMMM YYYY [um] HH:mm:ss [Uhr]'));
            }
            testRssUrl(url, function (title) {
                if (title) {
                    rssdb(event.channel.getName()).push({
                        url: url,
                        title: title,
                        by: event.user.getNick(),
                        ts: Date.now()
                    });
                    return event.user.notice('RSS Feed "%s" erfolgreich abboniert.', ircC.bold(title));
                } else {
                    return event.user.notice('Die URL scheint kein ungültiger RSS Feed zu sein ¯\\_(ツ)_/¯');
                }
            });
        } else if (action.toLowerCase() === 'unsubscribe') {
            if (!url) {
                return event.user.notice('Benutze: !chanrss unsubscribe <url>');
            }
            entry = rssdb(event.channel.getName()).find({ url: url });
            if (_.isUndefined(entry)) {
                return event.user.notice('Diese URL wurde für diesen Channel nicht abboniert.');
            }
            rssdb(event.channel.getName()).remove({url: url});
            return event.user.notice('RSS Feed "%s" erfolgreich entfernt.', ircC.bold(entry.title));
        } else if (action.toLowerCase() === 'list') {
            var entries = rssdb(event.channel.getName()).value();
            if (_.isUndefined(entries) || entries.length === 0) {
                return event.user.notice('Dieser Channel hat noch keine RSS Feeds abboniert.');
            }
            return event.user.notice('RSS Feeds für %s: %s.', event.channel.getName(), _.map(entries, function (e) {
                return ircC.bold(e.title) + ' (' + e.url + ')';
            }).join(', '));
        }
    });
    glados.hear(/^!rss( \S+)?( .+)?$/i, function (match, event) {
        var action = match[1] ? match[1].trim() : null;
        var url = match[2] ? match[2].trim() : null;
        var entry;
        if (!action) {
            return event.user.notice('Benutze: !rss <subscribe/unsubscribe/list> [url]');
        } else if (action.toLowerCase() === 'subscribe') {
            if (!url) {
                return event.user.notice('Benutze: !rss subscribe <url>');
            }
            entry = rssdb(event.user.getNick()).find({ url: url });
            if (!_.isUndefined(entry)) {
                return event.user.notice('Diese URL wurde bereits am %s von dir abboniert.',
                    moment(new Date(entry.ts)).format('DD. MMMM YYYY [um] HH:mm:ss [Uhr]'));
            }
            testRssUrl(url, function (title) {
                if (title) {
                    rssdb(event.user.getNick()).push({
                        url: url,
                        title: title,
                        ts: Date.now()
                    });
                    return event.user.notice('RSS Feed "%s" erfolgreich abboniert.', ircC.bold(title));
                } else {
                    return event.user.notice('Die URL scheint kein ungültiger RSS Feed zu sein ¯\\_(ツ)_/¯');
                }
            });
        } else if (action.toLowerCase() === 'unsubscribe') {
            if (!url) {
                return event.user.notice('Benutze: !rss unsubscribe <url>');
            }
            entry = rssdb(event.user.getNick()).find({ url: url });
            if (_.isUndefined(entry)) {
                return event.user.notice('Diese URL wurde von dir nicht abboniert.');
            }
            rssdb(event.user.getNick()).remove({url: url});
            return event.user.notice('RSS Feed "%s" erfolgreich entfernt.', ircC.bold(entry.title));
        } else if (action.toLowerCase() === 'list') {
            var entries = rssdb(event.user.getNick()).value();
            if (_.isUndefined(entries) || entries.length === 0) {
                return event.user.notice('Du hast noch keine RSS Feeds abboniert.');
            }
            return event.user.notice('RSS Feeds: %s.', _.map(entries, function (e) {
                return ircC.bold(e.title) + ' (' + e.url + ')';
            }).join(', '));
        }
    });

    new CronJob({
        cronTime: '*/10 * * * *',
        start: true,
        onTick: function () {
            checkAllFeeds(true);
        }
    });
    checkAllFeeds(false);
    return next();
};
exports.info = {
    name: 'rss',
    displayName: 'RSS',
    desc: [
        'RSS-Feeds für dich oder einen ganzen Channel abbonieren.',
        'Sobald ein neuer Eintrag im Feed gefunden wird, wird dieser via notice mitgeteilt.'
    ],
    version: '1.0.0',
    commands: [{
        name: 'rss subscribe',
        params: {
            'Feed-URL': 'required'
        },
        desc: ['Abboniert den angegebenen RSS Feed.']
    },{
        name: 'rss unsubscribe',
        params: {
            'Feed-URL': 'required'
        },
        desc: ['Entfernt den angegebenen RSS Feed.']
    },{
        name: 'rss list',
        desc: ['Listet alle deine abbonierten RSS Feeds auf.']
    },{
        name: 'chanrss subscribe',
        params: {
            'Feed-URL': 'required'
        },
        desc: [
            'Abboniert den angegebenen RSS Feed für den aktuellen Channel.',
            'Kann nur von Channel-Operatoren genutzt werden.'
        ]
    },{
        name: 'chanrss unsubscribe',
        params: {
            'Feed-URL': 'required'
        },
        desc: [
            'Entfernt den angegebenen RSS Feed für den aktuellen Channel.',
            'Kann nur von Channel-Operatoren genutzt werden.'
        ]
    },{
        name: 'chanrss list',
        desc: [
            'Listet alle deine abbonierten RSS Feeds für den aktuellen Channel auf.',
            'Kann nur von Channel-Operatoren genutzt werden.'
        ]
    }]
};
