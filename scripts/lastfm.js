'use strict';
var _ = require('underscore');
var utils = require(__dirname + '/../lib/utils');
var LastFmNode = require('lastfm').LastFmNode;

module.exports = function (scriptLoader, irc) {
    var lastfm, getRecentTrackInfo, getComparison;

    lastfm = new LastFmNode({
        api_key: irc.config.lastfmKey,
        useragent: irc.config.userAgent
    });

    getRecentTrackInfo = function (name, fn) {
        lastfm.request('user.getRecentTracks', {
            user: name,
            limit: 1,
            handlers: {
                success: function (data) {
                    if (data.recenttracks.hasOwnProperty('track')) {
                        var track = _.isArray(data.recenttracks.track) ? data.recenttracks.track[0] : data.recenttracks.track;
                        track.nowplaying = track.hasOwnProperty('@attr') && track['@attr'].nowplaying === 'true';
                        lastfm.request('track.getInfo', {
                            mbid: track.mbid,
                            track: track.name,
                            artist: track.artist['#text'],
                            username: name,
                            handlers: {
                                success: function (data) {
                                    var trackinfo = data.track,
                                        playcount = trackinfo.userplaycount ? (trackinfo.userplaycount + 'x') : 'Unknown';
                                    if (track.nowplaying) {
                                        fn(irc.clrs('\'{B}' + name + '{R}\' is now playing: {B}{C}' + trackinfo.artist.name + ' - ' + trackinfo.name + '{R} [playcount {B}' + playcount + '{R}] [{B}{O}' + utils.formatTime(trackinfo.duration / 1000) + '{R}]'));
                                    } else {
                                        fn(irc.clrs('\'{B}' + name + '{R}\' is not listening to anything right now. The last played track is {B}{C}' + trackinfo.artist.name + ' - ' + trackinfo.name + '{R}, back in ' + track.date['#text'] + ' UTC.'));
                                    }
                                },
                                error: function (error) {
                                    fn(error.message);
                                }
                            }
                        });
                    } else {
                        fn('\'' + name + '\' hasn\'t scrobbled any tracks yet.');
                    }
                },
                error: function (error) {
                    fn(error.message);
                }
            }
        });
    };

    getComparison = function (name1, name2, fn) {
        lastfm.request('tasteometer.compare', {
            type1: 'user',
            value1: name1,
            type2: 'user',
            value2: name2,
            handlers: {
                success: function (data) {
                    fn(null, {
                        "name1": data.comparison.input.user[0].name,
                        "name2": data.comparison.input.user[1].name,
                        "score": Number((parseFloat(data.comparison.result.score) * 100).toFixed(2)),
                        "common": _.map(data.comparison.result.artists.artist, function (artist) {
                            return artist.name;
                        })
                    });
                },
                error: function (error) {
                    fn(error.message, null);
                }
            }
        });
    };

    scriptLoader.registerCommand('np', function (event) {
        if (event.params.length === 0) {
            irc.brain.hget('last.fm', event.user.getNick(), function (err, name) {
                if (name === null) {
                    event.user.notice('Use: !np SET <last.fm username>');
                } else {
                    getRecentTrackInfo(name, function (message) {
                        event.channel.say(message);
                    });
                }
            });
        } else {
            if (event.params[0].toUpperCase() === 'SET') {
                if (event.params.length === 2) {
                    irc.brain.hset('last.fm', event.user.getNick(), event.params[1]);
                    event.user.notice('You\'re now associated with http://last.fm/user/' + event.params[1]);
                } else {
                    event.user.notice('Use: !np SET <last.fm username>');
                }
            } else if (event.params[0].toUpperCase() === 'COMPARE') {
                if (event.params.length > 1) {
                    if (event.params.length === 2) {
                        irc.brain.hget('last.fm', event.user.getNick(), function (err, name) {
                            if (name === null) {
                                event.user.notice('Use: !np SET <last.fm username>');
                            } else {
                                getComparison(name, event.params[1], function (error, comparison) {
                                    if (error) {
                                        event.channel.reply(event.user, error);
                                    } else {
                                        var str = comparison.name1 + ' vs ' + comparison.name2 + ': {B}' + comparison.score + '%{R}';
                                        if (comparison.common.length > 0) {
                                            str += ' - Common artists include: ' + comparison.common.join(', ');
                                        }
                                        event.channel.say(irc.clrs(str));
                                    }
                                });
                            }
                        });
                    } else if (event.params.length === 3) {
                        getComparison(event.params[1], event.params[2], function (error, comparison) {
                            if (error) {
                                event.channel.reply(event.user, error);
                            } else {
                                var str = comparison.name1 + ' vs ' + comparison.name2 + ': {B}' + comparison.score + '%{R}';
                                if (comparison.common.length > 0) {
                                    str += ' - Common artists include: ' + comparison.common.join(', ');
                                }
                                event.channel.say(irc.clrs(str));
                            }
                        });
                    }
                } else {
                    event.user.notice('Use: !np COMPARE <last.fm username> [last.fm username]');
                }
            } else {
                irc.brain.hget('last.fm', event.params[0], function (err, name) {
                    getRecentTrackInfo(name || event.params[0], function (message) {
                        event.channel.say(message);
                    });
                });
            }
        }
    });
};