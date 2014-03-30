'use strict';
var debug = require('debug')('glados:script:lastfm');
var _ = require('underscore');
var utils = require(__dirname + '/../lib/utils');
var LastFmNode = require('lastfm').LastFmNode;

module.exports = function () {
    return function (irc) {
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
                        var track = _.isArray(data.recenttracks.track) ? data.recenttracks.track[0] : data.recenttracks.track;
                        track.nowplaying = track.hasOwnProperty('@attr') && track['@attr'].nowplaying === 'true';
                        lastfm.request('track.getInfo', {
                            mbid: track.mbid,
                            username: name,
                            handlers: {
                                success: function (data) {
                                    var trackinfo = data.track,
                                        playcount = trackinfo.userplaycount ? (trackinfo.userplaycount + 'x') : 'Unknown';
                                    if (track.nowplaying) {
                                        fn(irc.clrs('\'{B}' + name + '{R}\' is now playing: {B}{C}' + trackinfo.artist.name + ' - ' + trackinfo.name + '{R} [playcount {B}' + playcount + 'x{R}] [{B}{O}' + utils.formatTime(trackinfo.duration / 1000) + '{R}]'));
                                    } else {
                                        fn(irc.clrs('\'{B}' + name + '{R}\' is not listening to anything right now. The last played track is {B}{C}' + trackinfo.artist.name + ' - ' + trackinfo.name + '{R}, back in ' + track.date['#text'] + ' UTC.'));
                                    }
                                },
                                error: function (error) {
                                    fn(error.message);
                                }
                            }
                        });
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
                        console.log(data);
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

        irc.command('np', function (event) {
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
                                            event.channel.say(irc.clrs(comparison.name1 + ' vs ' + comparison.name2 + ': {B}' + comparison.score + '%{R} - Common artists include: ' + comparison.common.join(', ')));
                                        }
                                    });
                                }
                            });
                        } else if (event.params.length === 3) {
                            getComparison(event.params[1], event.params[2], function (error, comparison) {
                                if (error) {
                                    event.channel.reply(event.user, error);
                                } else {
                                    event.channel.say(irc.clrs(comparison.name1 + ' vs ' + comparison.name2 + ': {B}' + comparison.score + '%{R} - Common artists include: ' + comparison.common.join(', ')));
                                }
                            });
                        }
                    } else {
                        event.user.notice('Use: !np COMPARE <last.fm username> [last.fm username]');
                    }
                } else {
                    var name = event.params[0];
                    getRecentTrackInfo(name, function (error, song) {
                        if (!error) {
                            if (song.nowplaying) {
                                event.channel.say(irc.clrs('\'{B}' + name + '{R}\' is now playing: {B}{C}' + song.artist + ' - ' + song.title + '{R} [playcount ' + song.playcount + 'x] [{B}' + song.durationf + '{R}]'));
                            } else {
                                event.channel.say(irc.clrs('\'{B}' + name + '{R}\' is not listening to anything right now. The last played track is {B}{C}' + song.artist + ' - ' + song.title + '{R}, back in ' + song.date + ' UTC.'));
                            }
                        } else {
                            event.channel.say(error);
                        }
                    });
                }
            }
        });
    };
};