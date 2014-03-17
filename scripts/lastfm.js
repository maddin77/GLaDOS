'use strict';
var request = require('request');
var utils = require(__dirname + '/../lib/utils');
var debug = require('debug')('glados:script:lastfm');
var _ = require('underscore');

module.exports = function () {
    return function (irc) {
        var getRecentTrack, getTrackInfo, getRecentTrackInfo;

        getRecentTrack = function (username, fn) {
            request({
                "uri": 'http://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=' + username + '&api_key=' + irc.config.lastfmKey + '&format=json&limit=1',
                "json": true,
                "headers": {
                    "User-Agent": irc.config.userAgent
                }
            }, function (error, response, data) {
                if (!error && response.statusCode === 200) {
                    if (data.error) {
                        fn(data.message, null);
                    } else {
                        var song;
                        if (_.isArray(data.recenttracks.track)) {
                            song = data.recenttracks.track[0];
                            fn(null, {
                                "artist": song.artist['#text'],
                                "title": song.name,
                                "album": song.album['#text'],
                                "nowplaying": true
                            });
                        } else {
                            song = data.recenttracks.track;
                            fn(null, {
                                "artist": song.artist['#text'],
                                "title": song.name,
                                "album": song.album['#text'],
                                "date": song.date['#text'],
                                "nowplaying": false
                            });
                        }
                    }
                } else {
                    debug('%s', error);
                    fn(error, null);
                }
            });
        };
        getTrackInfo = function (artist, title, username, fn) {
            request({
                "uri": 'http://ws.audioscrobbler.com/2.0/?method=track.getInfo&api_key=' + irc.config.lastfmKey + '&artist=' + artist + '&track=' + title + '&username=' + username + '&format=json',
                "json": true,
                "headers": {
                    "User-Agent": irc.config.userAgent
                }
            }, function (error, response, data) {
                if (!error && response.statusCode === 200) {
                    if (data.error) {
                        fn(data.message, null);
                    } else {
                        fn(null, {
                            "duration": data.track.duration,
                            "durationf": utils.formatTime(data.track.duration / 1000),
                            "playcount": data.track.userplaycount
                        });
                    }
                } else {
                    debug('%s', error);
                    fn(error, null);
                }
            });
        };
        getRecentTrackInfo = function (username, fn) {
            getRecentTrack(username, function (error, track) {
                if (error) {
                    fn(error, null);
                } else {
                    getTrackInfo(track.artist, track.title, username, function (error, info) {
                        if (error) {
                            fn(error, null);
                        } else {
                            fn(null, _.extend(track, info));
                        }
                    });
                }
            });
        };


        irc.command('np', function (event) {
            if (event.params.length === 0) {
                irc.brain.hget('last.fm', event.user.getNick(), function (err, name) {
                    if (name === null) {
                        event.user.notice('Use: !np SET <last.fm username>');
                    } else {
                        getRecentTrackInfo(name, function (error, song) {
                            if (!error) {
                                if (song.nowplaying) {
                                    event.channel.say(irc.clrs('"{B}' + name + '{R}" is now playing: {B}{C}' + song.artist + ' - ' + song.title + '{R} [playcount ' + song.playcount + 'x] [{B}' + song.durationf + '{R}]'));
                                } else {
                                    event.channel.say(irc.clrs('"{B}' + name + '{R}" is not listening to anything right now. The last played track is {B}{C}' + song.artist + ' - ' + song.title + '{R}, back in ' + song.date + ' UTC.'));
                                }
                            } else {
                                event.channel.say(error);
                            }
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
                } else {
                    var name = event.params[0];
                    getRecentTrackInfo(name, function (error, song) {
                        if (!error) {
                            if (song.nowplaying) {
                                event.channel.say(irc.clrs('"{B}' + name + '{R}" is now playing: {B}{C}' + song.artist + ' - ' + song.title + '{R} [playcount ' + song.playcount + 'x] [{B}' + song.durationf + '{R}]'));
                            } else {
                                event.channel.say(irc.clrs('"{B}' + name + '{R}" is not listening to anything right now. The last played track is {B}{C}' + song.artist + ' - ' + song.title + '{R}, back in ' + song.date + ' UTC.'));
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