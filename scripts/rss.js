var request = require('request');
var CronJob = require('cron').CronJob;
var async   = require('async');
var _       = require('underscore');
var ircC    = require('irc-colors');

module.exports = function (scriptLoader) {

    var cronJob, checkFeed, shortLink, subscribe, unsubscribe, isSubscribed, listSubscriptions, sortSubscriptions, checkedCache, checkEntries, fetchNewEntries, rssdb;

    rssdb                                                   = scriptLoader.database('rss');
    rssdb.useragent                                         = rssdb.useragent || scriptLoader.connection.config.userAgent;
    rssdb.cronTime                                          = rssdb.cronTime || '*/10 * * * *';
    rssdb.subscriptions                                     = rssdb.subscriptions || {};
    rssdb.subscriptions[scriptLoader.connection.getId()]    = rssdb.subscriptions[scriptLoader.connection.getId()] || {};
    rssdb.save();

    checkedCache = [];

    sortSubscriptions = function () {
        var subscriptions = {}, tmpArr = [];
        _.each(rssdb.subscriptions[scriptLoader.connection.getId()], function (array, name) {
            _.each(array, function (url) {
                subscriptions[url] = subscriptions[url] || [];
                subscriptions[url].push(name);
            });
        });
        scriptLoader.debug(subscriptions);
        _.each(subscriptions, function (value, key) {
            tmpArr.push({
                url: key,
                subscribers: value
            });
        });
        scriptLoader.debug(tmpArr);
        return tmpArr;
    };

    shortLink = function (url, fn) {
        request.post({
            'uri': 'https://www.googleapis.com/urlshortener/v1/url',
            'body': {
                'longUrl': url
            },
            'json': true
        }, function (err, res, data) {
            if (!err) {
                if (res.statusCode === 200) {
                    return fn(data.id);
                }
            }
            fn(url);
        });
    };

    fetchNewEntries = function (url, fn) {
        scriptLoader.debug('Fetching entries from %s.', url);
        request({
            'uri': 'http://ajax.googleapis.com/ajax/services/feed/load?v=1.0&num=20&q=' + encodeURIComponent(url),
            'headers': {
                'User-Agent': rssdb.useragent
            },
            'json': true
        }, function (err, res, data) {
            if (!err) {
                if (res.statusCode === 200) {
                    if (data.responseStatus === 200) {
                        var newEntries = [];
                        _.each(data.responseData.feed.entries, function (entry) {
                            if (!_.contains(checkedCache, entry.link)) {
                                scriptLoader.debug('added %s to cache', entry.link);
                                checkedCache.push(entry.link);
                                newEntries.push(entry);
                            }
                        });
                        if (fn) {
                            async.map(newEntries, function (entry, callback) {
                                scriptLoader.debug('%s is new => ship', entry.link);
                                shortLink(entry.link, function (surl) {
                                    entry.shortlink = surl;
                                    callback(null, entry);
                                });
                            }, function (err, results) {
                                fn(null, {
                                    title: data.responseData.feed.title,
                                    entries: results
                                });
                            });
                        }
                    }
                }
            } else {
                scriptLoader.debug(err);
                if (fn) {
                    fn(err, null);
                }
            }
        });
    };

    checkEntries = function (notice) {
        var subscriptions = sortSubscriptions();
        if (!notice) {
            _.each(subscriptions, function (subscription) {
                fetchNewEntries(subscription.url);
            });
        } else {
            async.map(subscriptions, function (sub, callback) {
                fetchNewEntries(sub.url, function (err, data) {
                    if (err) {
                        callback(err, null);
                    } else {
                        sub.title = data.title;
                        sub.entries = data.entries;
                        callback(err, sub);
                    }
                });
            }, function (err, results) {
                _.each(results, function (feed) {
                    if (feed.entries.length > 0) {
                        _.each(feed.subscribers, function (subscriber) {
                            scriptLoader.connection.send(subscriber, '[' + feed.title + '] ' + _.map(feed.entries, function (entry) {
                                return ircC.bold(entry.title) + ' (' + entry.shortlink + ')';
                            }).join(', '));
                        });
                    }
                });
            });
        }
    };
    checkEntries(false);

    cronJob = new CronJob({
        cronTime: rssdb.cronTime,
        onTick: function () {
            checkEntries(true);
        },
        start: true
    });

    scriptLoader.on('unload', function () {
        cronJob.stop();
    });

    checkFeed = function (url, fn) {
        request({
            'uri': 'http://ajax.googleapis.com/ajax/services/feed/load?v=1.0&num=20&q=' + encodeURIComponent(url),
            'headers': {
                'User-Agent': rssdb.useragent
            },
            'json': true
        }, function (err, res, data) {
            if (!err) {
                if (res.statusCode === 200) {
                    if (data.responseStatus === 200) {
                        return fn(data.responseData.feed.title);
                    }
                } else {
                    scriptLoader.debug(err);
                }
            }
            return fn(null);
        });
    };

    subscribe = function (target, url) {
        rssdb.subscriptions[scriptLoader.connection.getId()][target] = rssdb.subscriptions[scriptLoader.connection.getId()][target] || [];
        rssdb.subscriptions[scriptLoader.connection.getId()][target].push(url);
        rssdb.subscriptions[scriptLoader.connection.getId()][target] = _.uniq(rssdb.subscriptions[scriptLoader.connection.getId()][target]);
        rssdb.save();
    };

    unsubscribe = function (target, url) {
        rssdb.subscriptions[scriptLoader.connection.getId()][target] = rssdb.subscriptions[scriptLoader.connection.getId()][target] || [];
        rssdb.subscriptions[scriptLoader.connection.getId()][target] = _.without(rssdb.subscriptions[scriptLoader.connection.getId()][target], url);
        rssdb.save();
    };

    isSubscribed = function (target, url) {
        rssdb.subscriptions[scriptLoader.connection.getId()][target] = rssdb.subscriptions[scriptLoader.connection.getId()][target] || [];
        return rssdb.subscriptions[scriptLoader.connection.getId()][target].indexOf(url) > -1;
    };

    listSubscriptions = function (target) {
        return rssdb.subscriptions[scriptLoader.connection.getId()][target] || [];
    };

    scriptLoader.on('command', 'rss', function (event) {
        if (event.params.length > 0) {
            var feedUrl, feeds;
            if (event.params[0].toUpperCase() === 'SUBSCRIBE') {
                if (event.params.length > 1) {
                    feedUrl = event.params[1];
                    checkFeed(feedUrl, function (title) {
                        if (title !== null) {
                            fetchNewEntries(feedUrl);//Set cache so we dont get the first X messages.
                            event.user.notice('You successfully subscribed to the "' + title + '" rss feed. I\'ll now notice you every time i find a new entry.');
                            event.user.notice('To unsubscribe, use "!rss UNSUBSCRIBE ' + feedUrl + '".');
                            subscribe(event.user.getNick(), feedUrl);
                        } else {
                            event.user.notice('The URL seems to be an invalid rss feed.');
                        }
                    });
                } else {
                    event.user.notice('Use: !rss SUBSCRIBE <feed url>');
                }
            } else if (event.params[0].toUpperCase() === 'UNSUBSCRIBE') {
                if (event.params.length > 1) {
                    feedUrl = event.params[1];
                    if (isSubscribed(event.user.getNick(), feedUrl)) {
                        event.user.notice('You successfully unsubscribed from the rss feed.');
                        unsubscribe(event.user.getNick(), feedUrl);
                    } else {
                        event.user.notice('You\'re not subscribed to this rss feed.');
                    }
                } else {
                    event.user.notice('Use: !rss UNSUBSCRIBE <feed url>');
                }
            } else if (event.params[0].toUpperCase() === 'LIST') {
                feeds = listSubscriptions(event.user.getNick());
                if (feeds.length > 0) {
                    event.user.notice('You\'re subscribed to the following rss feeds: ' + feeds.join(', '));
                } else {
                    event.user.notice('You haven\'t subscribed to any rss feeds yet.');
                }
            } else {
                event.user.notice('Use: !rss <subscribe/unsubscribe/list> [feed url]');
            }
        } else {
            event.user.notice('Use: !rss <subscribe/unsubscribe/list> [feed url]');
        }
    });
    scriptLoader.on('command', 'chanrss', function (event) {
        if (event.channel.userHasMode(event.user, '!') || event.channel.userHasMode(event.user, '~') ||
                event.channel.userHasMode(event.user, '&') || event.channel.userHasMode(event.user, '@') || event.channel.userHasMode(event.user, '%')) {
            if (event.params.length > 0) {
                var feedUrl, feeds;
                if (event.params[0].toUpperCase() === 'SUBSCRIBE') {
                    if (event.params.length > 1) {
                        feedUrl = event.params[1];
                        checkFeed(feedUrl, function (title) {
                            if (title !== null) {
                                fetchNewEntries(feedUrl);//Set cache so we dont get the first X messages.
                                event.user.notice('You successfully subscribed ' + event.channel.getName() + ' to the "' + title + '" rss feed. I\'ll send a notice to the channel every time i find a new entry.');
                                event.user.notice('To unsubscribe, use "!chanrss UNSUBSCRIBE ' + feedUrl + '".');
                                subscribe(event.channel.getName(), feedUrl);
                            } else {
                                event.user.notice('The URL seems to be an invalid rss feed.');
                            }
                        });
                    } else {
                        event.user.notice('Use: !chanrss SUBSCRIBE <feed url>');
                    }
                } else if (event.params[0].toUpperCase() === 'UNSUBSCRIBE') {
                    if (event.params.length > 1) {
                        feedUrl = event.params[1];
                        if (isSubscribed(event.channel.getName(), feedUrl)) {
                            event.user.notice('You successfully unsubscribed ' + event.channel.getName() + ' from the rss feed.');
                            unsubscribe(event.channel.getName(), feedUrl);
                        } else {
                            event.user.notice(event.channel.getName() + ' isn\'t subscribed to this rss feed.');
                        }
                    } else {
                        event.user.notice('Use: !chanrss UNSUBSCRIBE <feed url>');
                    }
                } else if (event.params[0].toUpperCase() === 'LIST') {
                    feeds = listSubscriptions(event.channel.getName());
                    if (feeds.length > 0) {
                        event.user.notice(event.channel.getName() + ' is subscribed to the following rss feeds: ' + feeds.join(', '));
                    } else {
                        event.user.notice(event.channel.getName() + ' hasn\'t subscribed to any rss feeds yet.');
                    }
                } else {
                    event.user.notice('Use: !chanrss <subscribe/unsubscribe/list> [feed url]');
                }
            } else {
                event.user.notice('Use: !chanrss <subscribe/unsubscribe/list> [feed url]');
            }
        } else {
            event.user.notice('You don\'t have the permissions to use this command.');
        }
    });
};