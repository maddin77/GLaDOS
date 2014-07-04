'use strict';
var debug = require('debug')('GLaDOS:script:rss');
var request = require('request');
var CronJob = require('cron').CronJob;
var async = require('async');
var _ = require('underscore');

module.exports = function (scriptLoader, irc) {

    var cronJob, checkFeed, shortLink, subscribe, unsubscribe, isSubscribed, listSubscriptions, sortSubscriptions, checkedCache, checkEntries, fetchNewEntries;

    checkedCache = [];

    sortSubscriptions = function (fn) {
        var subscriptions = {};
        irc.brain.keys('rss:*', function (err, keys) {
            async.each(keys, function (key, callback) {
                irc.brain.smembers(key, function (err, urls) {
                    urls.forEach(function (url) {
                        subscriptions[url] = subscriptions[url] || [];
                        subscriptions[url].push(key.substr(4));
                    });
                    callback(err);
                });
            }, function (err) {
                if (err) {
                    debug(err);
                } else {
                    fn(subscriptions);
                }
            });
        });
    };

    shortLink = function (url, fn) {
        request.post({
            "uri": "https://www.googleapis.com/urlshortener/v1/url",
            "body": {
                "longUrl": url
            },
            "json": true
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
        debug('Fetching entries from %s.', url);
        request({
            "uri": 'http://ajax.googleapis.com/ajax/services/feed/load?v=1.0&num=20&q=' + encodeURIComponent(url),
            "headers": {
                "User-Agent": irc.config.userAgent
            },
            "json": true
        }, function (err, res, data) {
            if (!err) {
                if (res.statusCode === 200) {
                    if (data.responseStatus === 200) {
                        var newEntries = [];
                        _.each(data.responseData.feed.entries, function (entry) {
                            if (!_.contains(checkedCache, entry.link)) {
                                checkedCache.push(entry.link);
                                newEntries.push(entry);
                            }
                        });
                        if (fn) {
                            fn(data.responseData.feed.title, newEntries);
                        }
                    }
                }
            } else {
                debug(err);
                if (fn) {
                    fn(null, []);
                }
            }
        });
    };

    checkEntries = function (notice) {
        sortSubscriptions(function (subscriptions) {
            _.each(subscriptions, function (targets, url) {
                fetchNewEntries(url, function (title, entries) {
                    if (notice) {
                        debug('Checking for new entries in %s: Found %s.', title, entries.length, entries);
                        _.each(entries, function (entry) {
                            shortLink(entry.link, function (shortLink) {
                                _.each(targets, function (target) {
                                    irc.notice(target, irc.clrs('[' + title + '] {B}' + entry.title + '{R} (' + shortLink + ')'));
                                });
                            });
                        });
                    }
                });
            });
        });
    };
    checkEntries(false);

    cronJob = new CronJob({
        cronTime: '*/10 * * * *',
        onTick: function () {
            checkEntries(true);
        },
        start: true
    });

    scriptLoader.unload(function () {
        cronJob.stop();
    });

    checkFeed = function (url, fn) {
        request({
            "uri": 'http://ajax.googleapis.com/ajax/services/feed/load?v=1.0&num=20&q=' + encodeURIComponent(url),
            "headers": {
                "User-Agent": irc.config.userAgent
            },
            "json": true
        }, function (err, res, data) {
            if (!err) {
                if (res.statusCode === 200) {
                    if (data.responseStatus === 200) {
                        return fn(data.responseData.feed.title);
                    }
                } else {
                    debug(err);
                }
            }
            return fn(null);
        });
    };

    subscribe = function (target, url) {
        irc.brain.sadd('rss:' + target, url);
    };

    unsubscribe = function (target, url) {
        irc.brain.srem('rss:' + target, url);
    };

    isSubscribed = function (target, url, fn) {
        irc.brain.sismember('rss:' + target, url, function (error, isMember) {
            if (error) {
                debug(error);
                fn(false);
            } else {
                fn(isMember);
            }
        });
    };

    listSubscriptions = function (target, fn) {
        irc.brain.smembers('rss:' + target, function (error, feedUrls) {
            if (error) {
                debug(error);
                fn([]);
            } else {
                fn(feedUrls);
            }
        });
    };

    scriptLoader.registerCommand('rss', function (event) {
        if (event.params.length > 0) {
            var feedUrl;
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
                    isSubscribed(event.user.getNick(), feedUrl, function (subscribed) {
                        if (subscribed) {
                            event.user.notice('You successfully unsubscribed from the rss feed.');
                            unsubscribe(event.user.getNick(), feedUrl);
                        } else {
                            event.user.notice('You\'re not subscribed to this rss feed.');
                        }
                    });
                } else {
                    event.user.notice('Use: !rss UNSUBSCRIBE <feed url>');
                }
            } else if (event.params[0].toUpperCase() === 'LIST') {
                listSubscriptions(event.user.getNick(), function (feeds) {
                    if (feeds.length > 0) {
                        event.user.notice('You\'re subscribed to the following rss feeds: ' + feeds.join(', '));
                    } else {
                        event.user.notice('You haven\'t subscribed to any rss feeds yet.');
                    }
                });
            } else {
                event.user.notice('Use: !rss <subscribe/unsubscribe/list> [feed url]');
            }
        } else {
            event.user.notice('Use: !rss <subscribe/unsubscribe/list> [feed url]');
        }
    });
    scriptLoader.registerCommand('chanrss', function (event) {
        if (event.channel.userHasMode(event.user, '!') || event.channel.userHasMode(event.user, '~') ||
                event.channel.userHasMode(event.user, '&') || event.channel.userHasMode(event.user, '@') || event.channel.userHasMode(event.user, '%')) {
            if (event.params.length > 0) {
                var feedUrl;
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
                        isSubscribed(event.channel.getName(), feedUrl, function (subscribed) {
                            if (subscribed) {
                                event.user.notice('You successfully unsubscribed ' + event.channel.getName() + ' from the rss feed.');
                                unsubscribe(event.channel.getName(), feedUrl);
                            } else {
                                event.user.notice(event.channel.getName() + ' isn\'t subscribed to this rss feed.');
                            }
                        });
                    } else {
                        event.user.notice('Use: !chanrss UNSUBSCRIBE <feed url>');
                    }
                } else if (event.params[0].toUpperCase() === 'LIST') {
                    listSubscriptions(event.channel.getName(), function (feeds) {
                        if (feeds.length > 0) {
                            event.user.notice(event.channel.getName() + ' is subscribed to the following rss feeds: ' + feeds.join(', '));
                        } else {
                            event.user.notice(event.channel.getName() + ' hasn\'t subscribed to any rss feeds yet.');
                        }
                    });
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