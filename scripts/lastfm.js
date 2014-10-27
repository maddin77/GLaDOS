var _           = require('underscore');
var utils       = require(__dirname + '/../lib/utils');
var util        = require('util');
var LastFmNode  = require('lastfm').LastFmNode;
var ircC        = require('irc-colors');

module.exports = function (scriptLoader) {
    var lastfm, getRecentTrackInfo, getComparison, lstfmdb;

    lstfmdb             = scriptLoader.database('lastfm');
    lstfmdb.key         = lstfmdb.key || '';
    lstfmdb.useragent   = lstfmdb.useragent || scriptLoader.connection.config.userAgent;
    lstfmdb.alias       = lstfmdb.alias || {};
    lstfmdb.save();

    lastfm = new LastFmNode({
        'api_key': lstfmdb.key,
        useragent: lstfmdb.useragent
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
                                        fn(util.format('\'%s\' is now playing %s [playcount %s] [%s]',
                                            ircC.bold(name),
                                            ircC.cyan.bold(trackinfo.artist.name + ' - ' + trackinfo.name),
                                            ircC.bold(playcount),
                                            ircC.bold.olive(utils.formatTime(trackinfo.duration / 1000))
                                            ));
                                    } else {
                                        fn(util.format('\'%s\' is not listening to anything right now. The last played track is %s, back in %s UTC.',
                                            ircC.bold(name),
                                            ircC.cyan.bold(trackinfo.artist.name + ' - ' + trackinfo.name),
                                            track.date['#text']
                                            ));
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
                        'name1': data.comparison.input.user[0].name,
                        'name2': data.comparison.input.user[1].name,
                        'score': Number((parseFloat(data.comparison.result.score) * 100).toFixed(2)),
                        'common': _.map(data.comparison.result.artists.artist, function (artist) {
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

    scriptLoader.on('command', ['np', 'lastfm'], function (event) {
        if (event.params.length === 0) {
            if (_.has(lstfmdb.alias, event.user.getNick())) {
                getRecentTrackInfo(lstfmdb.alias[event.user.getNick()], function (message) {
                    event.channel.say(message);
                });
            } else {
                event.user.notice('Use: !np SET <last.fm username>');
            }
        } else {
            if (event.params[0].toUpperCase() === 'SET') {
                if (event.params.length === 2) {
                    lstfmdb.alias[event.user.getNick()] = event.params[1];
                    lstfmdb.save();
                    event.user.notice('You\'re now associated with http://last.fm/user/' + event.params[1]);
                } else {
                    event.user.notice('Use: !np SET <last.fm username>');
                }
            } else if (event.params[0].toUpperCase() === 'COMPARE') {
                if (event.params.length > 1) {
                    if (event.params.length === 2) {
                        if (_.has(lstfmdb.alias, event.user.getNick())) {
                            getComparison(lstfmdb.alias[event.user.getNick()], event.params[1], function (error, comparison) {
                                if (error) {
                                    event.channel.reply(event.user, error);
                                } else {
                                    var str = comparison.name1 + ' vs ' + comparison.name2 + ': ' + ircC.bold(comparison.score + '%');
                                    if (comparison.common.length > 0) {
                                        str += ' - Common artists include: ' + comparison.common.join(', ');
                                    }
                                    event.channel.say(str);
                                }
                            });
                        } else {
                            event.user.notice('Use: !np SET <last.fm username>');
                        }
                    } else if (event.params.length === 3) {
                        getComparison(event.params[1], event.params[2], function (error, comparison) {
                            if (error) {
                                event.channel.reply(event.user, error);
                            } else {
                                var str = comparison.name1 + ' vs ' + comparison.name2 + ': ' + ircC.bold(comparison.score + '%');
                                if (comparison.common.length > 0) {
                                    str += ' - Common artists include: ' + comparison.common.join(', ');
                                }
                                event.channel.say(str);
                            }
                        });
                    }
                } else {
                    event.user.notice('Use: !np COMPARE <last.fm username> [last.fm username]');
                }
            } else {
                getRecentTrackInfo(lstfmdb.alias[event.params[0]] || event.params[0], function (message) {
                    event.channel.say(message);
                });
            }
        }
    });
};