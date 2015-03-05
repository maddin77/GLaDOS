var LastFmNode  = require('lastfm').LastFmNode;
var ircC        = require('irc-colors');
var _           = require('lodash');
var util        = require('util');
var numeral     = require('numeral');
var moment      = require('moment');

exports.register = function (glados, next) {
    moment.locale('de');

    var lstfmdb = glados.brain('lstfm');
    var lastfm = new LastFmNode({
        'api_key': glados.config.object.AUTH.lastfm,
        useragent: glados.config.object.userAgent
    });

    var getTrackInfo = function (lastfmname, track, callback) {
        return lastfm.request('track.getInfo', {
            mbid: track.mbid,
            track: track.name,
            artist: track.artist['#text'],
            username: lastfmname,
            handlers: {
                success: function (data) {
                    var trackinfo = data.track,
                        playcount = trackinfo.userplaycount || 0;
                    if (track.nowplaying) {
                        var tags = [], tagstr = '';
                        if (_.has(trackinfo.toptags, 'tag')) {
                            if (_.isArray(trackinfo.toptags.tag)) {
                                tags = trackinfo.toptags.tag;
                            } else {
                                tags = [trackinfo.toptags.tag];
                            }
                            tags = _.map(tags, function (t) {
                                return ircC.red('#' + t.name);
                            });
                            tagstr = tags.join(' ') + ' ♫ ';
                        }

                        return callback(util.format('\'%s\' hört gerade zum %s mal %s ♫ %s%s',
                            ircC.bold(lastfmname),
                            ircC.bold(playcount < 2 ? 'ersten' : (playcount + '.')),
                            ircC.cyan.bold(trackinfo.artist.name + ' - ' + trackinfo.name),
                            tagstr,
                            ircC.bold.olive(numeral(trackinfo.duration / 1000).format('00:00:00'))
                        ));
                    } else {
                        var dur = moment.duration(moment(new Date(track.date['#text'] + ' UTC')).diff(moment()), 'ms');
                        return callback(util.format('\'%s\' hörte zuletzt %s ♫ %s',
                            ircC.bold(lastfmname),
                            ircC.cyan.bold(trackinfo.artist.name + ' - ' + trackinfo.name),
                            ircC.bold.olive(dur.humanize(true))
                            ));
                    }
                },
                error: function (error) {
                    return callback(error.message);
                }
            }
        });
    };
    var getRecentTrack = function (lastfmname, callback) {
        return lastfm.request('user.getRecentTracks', {
            user: lastfmname,
            limit: 1,
            handlers: {
                success: function (data) {
                    if (!_.has(data.recenttracks, 'track')) {
                        return callback('"' + lastfmname + '"" hat noch keine Musik zu ihrer/seiner Musiksammlung hinzugefügt.', null);
                    }
                    var track = _.isArray(data.recenttracks.track) ? data.recenttracks.track[0] : data.recenttracks.track;
                    track.nowplaying = _.has(track, '@attr') && track['@attr'].nowplaying === 'true';
                    return callback(null, track);
                },
                error: function (error) {
                    return callback(error.message, null);
                }
            }
        });
    };
    var getRecentTrackInfo = function (lastfmname, callback) {
        getRecentTrack(lastfmname, function (error, track) {
            if (error) {
                return callback(error);
            }
            getTrackInfo(lastfmname, track, callback);
        });
    };
    var getComparison = function (name1, name2, callback) {
        lastfm.request('tasteometer.compare', {
            type1: 'user',
            value1: name1,
            type2: 'user',
            value2: name2,
            handlers: {
                success: function (data) {
                    var score = Number((parseFloat(data.comparison.result.score) * 100).toFixed(2));
                    var common = _.map(data.comparison.result.artists.artist, function (artist) {
                        return ircC.cyan.bold(artist.name);
                    });
                    var str = ircC.bold(name1) + ' vs ' + ircC.bold(name2) + ': ' + ircC.bold.olive(score + '%') + ' Übereinstimmung.';
                    if (common.length > 0) {
                        str += ' Gemeinsame Künstler sind u.a.: ' + common.join(', ');
                    }
                    callback(str);
                },
                error: function (error) {
                    callback(error.message);
                }
            }
        });
    };

    var getLastfmName = function (nick) {
        return _.has(lstfmdb.object, nick) ? lstfmdb.object[nick] : nick;
    };

    glados.hear(/^!np(?::(set|compare))?( \S+)?( \S+)?$/i, function (match, event) {
        var action = match[1] ? match[1].trim() : null;
        var user1 = match[2] ? match[2].trim() : null;
        var user2 = match[3] ? match[3].trim() : null;

        if (action) {
            if (action.toUpperCase() === 'SET') {
                if (!user1) {
                    return event.user.notice('Benutze: !np:set <last.fm Benutzername>');
                }
                lstfmdb.object[event.user.getNick()] = user1;
                lstfmdb.save();
                return event.user.notice('Du wurdest erfolgreich mit last.fm user "' + user1 + '" verknüpft.');
            }
            if (action.toUpperCase() === 'COMPARE') {
                if (!user1) {
                    return event.user.notice('Benutze: !np:compare <last.fm Benutzername> [last.fm Benutzername]');
                }
                if (!user2) {
                    user2 = getLastfmName(event.user.getNick());
                }
                return getComparison(user1, user2, function (message) {
                    event.channel.say(message);
                });
            }
            return event.user.notice('Benutze: !np:set oder !np:compare');
        }

        if (!user1) {
            user1 = getLastfmName(event.user.getNick());
        } else if (user1.slice(0, 3) === 'fm:') {
            user1 = user1.slice(3);
        } else {
            user1 = getLastfmName(user1);
        }
        return getRecentTrackInfo(user1, function (message) {
            event.channel.say(message);
        });
    });
    return next();
};
exports.info = {
    name: 'lastfm',
    displayName: 'Last.fm',
    desc: ['Bietet verschiedene Befehle um mit der Last.FM API zu interagieren.'],
    version: '1.0.0',
    commands: [{
        name: 'np',
        desc: [
            'Gibt den Aktuellen Musiktitel aus, den der Benutzer via last.fm scrobbelt.',
            'Wird gerade kein Titel gescrobbelt, so wird der zu letzt gescrobbelte Titel ausgegeben.'
        ]
    },{
        name: 'np',
        params: {
            'Nick': 'required'
        },
        desc: [
            'Gibt den Aktuellen Musiktitel aus, den der angegebene Benutzer via last.fm scrobbelt.',
            'Wenn der Benutzer seinen Nick mit einem last.fm Benutzernamen verknüpft hat, so wird dieser genutzt.',
            'Möchte man nicht, das der Verknüpfte Benutzername genutzt wird, kann man "fm:" vor den Nick voranstellen.'
        ]
    },{
        name: '!np:set',
        params: {
            'last.fm Benutzername': 'required'
        },
        desc: [
            'Verknüpft den eigenen Nick mit dem angegebenen last.fm Benutzernamen damit dieser anstatt des Nick bei !np benutzt wird.'
        ]
    },{
        name: '!np:compare',
        params: {
            'last.fm Benutzername': 'required',
            'last.fm Benutzername2': 'optional'
        },
        desc: [
            'Vergleicht die Musikalische Übereinstimmung mit dem angegebenen last.fm Benutzer.',
            'Wird kein zweiter Benutzername angegeben, so wird mit dem eigenen Benutzernamen verglichen.'
        ]
    }]
};