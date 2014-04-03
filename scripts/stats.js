'use strict';
var _ = require('underscore');
var debug = require('debug')('glados:script:stats');
var _ = require('underscore');

module.exports = function () {
    var smileys, smileyRegexp, countSmileys;

    smileys = [
        ':-)', ':)', '=)', ':^)',
        ';)', ';-)',
        ':(', ':-(', '=(',
        ':\'(', ':\'-(',
        ':]', ':-]',
        ':[', ':-[',
        ':>', ':->',
        ':/', ':-/', ':\\', ':-\\',
        ':|', ':-|',
        ':S', ':-S',
        ':D', ':-D', 'D:', '=D', 'xD',
        ';D', ';-D',
        ':P', ':-P', 'xP',
        '\\o/', '\\o', 'o/',
        '^^', '^_^', '^-^', '^.^', '-_-', '-.-', '=_=',
        ':<', ':-<',
        ';_;',
        ':o', ':-o', ':0', ':-0',
        ':3', ':-3',
        ':c', ':-c',
        ':x', ':-x',
        'ಠ_ಠ', '¯\\_(ツ)_/¯', '(╯°□°）╯'
    ];
    smileyRegexp = new RegExp(_.map(smileys, function (smiley) {
        return '(' + smiley.replace(/[\[\]{}()*+?.\\|\^$\-,&#\s]/g, "\\$&") + ')';
    }).join('|'), 'gi');

    countSmileys = function (msg) {
        return (msg.match(smileyRegexp) || []).length;
    };

    return function (irc) {
        irc.on('chanmsg', function (event) {
            irc.brain.hincrby('stats:' + event.channel.getName(), 'messages', 1);
            irc.brain.hincrby('stats:' + event.channel.getName(), 'characters', event.message.length);
            irc.brain.hincrby('stats:' + event.channel.getName(), 'words', event.message.split(' ').length);
            irc.brain.hincrby('stats:' + event.channel.getName(), 'smileys', countSmileys(event.message));
            if (event.isAction) {
                irc.brain.hincrby('stats:' + event.channel.getName(), 'actions', 1);
            }
            if (event.message.match(/(http|ftp|https):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@?\^=%&amp;:\/~\+#]*[\w\-\@?\^=%&amp;\/~\+#])?/i)) {
                irc.brain.hincrby('stats:' + event.channel.getName(), 'urls', 1);
            }
            if (event.message.toUpperCase() === event.message) {
                irc.brain.hincrby('stats:' + event.channel.getName(), 'allcaps', 1);
            }
            if (event.message.slice(-1) === '?') {
                irc.brain.hincrby('stats:' + event.channel.getName(), 'questions', 1);
            }
        });
        irc.on('command', function (event) {
            irc.brain.hincrby('stats:' + event.channel.getName(), 'commands', 1);
        });
        irc.on('join', function (event) {
            if (event.user.getNick() === irc.config.irc.nick) {
                irc.brain.hexists('stats:' + event.channel.getName(), 'start', function (error, value) {
                    if (!error) {
                        if (value === 0) {
                            irc.brain.hset('stats:' + event.channel.getName(), 'start', Date.now());
                        }
                    } else {
                        debug('[join/hexists] %s', error);
                    }
                });
            }
            irc.brain.hincrby('stats:' + event.channel.getName(), 'joins', 1);
            irc.brain.hget('stats:' + event.channel.getName(), 'peak', function (error, peak) {
                var count = Object.keys(event.channel.getNames()).length;
                peak = peak || 0;
                if (!error) {
                    if (count > peak) {
                        irc.brain.hset('stats:' + event.channel.getName(), 'peak', count + ',' + Date.now());
                    }
                } else {
                    debug('[join/hget] %s', error);
                }
            });
        });
        irc.on('names', function (event) {
            irc.brain.hget('stats:' + event.channel.getName(), 'peak', function (error, peak) {
                var count = Object.keys(event.names).length;
                peak = peak || 0;
                if (!error) {
                    if (count > peak) {
                        irc.brain.hset('stats:' + event.channel.getName(), 'peak', count + ',' + Date.now());
                    }
                } else {
                    debug('[names] %s', error);
                }
            });
        });
        irc.on('part', function (event) {
            irc.brain.hincrby('stats:' + event.channel.getName(), 'parts', 1);
        });
        irc.on('kick', function (event) {
            irc.brain.hincrby('stats:' + event.channel.getName(), 'kicks', 1);
        });
        irc.on('mode', function (event) {
            if (event.channel !== null) {
                irc.brain.hincrby('stats:' + event.channel.getName(), 'modes', 1);
                if (event.mode === 'b') {
                    irc.brain.hincrby('stats:' + event.channel.getName(), 'bans', 1);
                }
            }
        });
        irc.on('topic', function (event) {
            if (event.topicChanged) {
                irc.brain.hincrby('stats:' + event.channel.getName(), 'topicchanges', 1);
            }
        });
        irc.command('stats', function (event) {
            irc.brain.hgetall('stats:' + event.channel.getName(), function (err, obj) {
                var stats = _.defaults(obj || {}, {
                    "joins": "0",
                    "start": "1395000994802",
                    "peak": "0,1395000994803",
                    "messages": "0",
                    "characters": "0",
                    "words": "0",
                    "smileys": "0",
                    "questions": "0",
                    "allcaps": "0",
                    "modes": "0",
                    "commands": "0",
                    "kicks": "0",
                    "urls": "0",
                    "actions": "0",
                    "bans": "0",
                    "parts": "0",
                    "quits": "0",
                    "topicchanges": "0"
                });
                event.channel.say('On ' + event.channel.getName() + ' there have been ' + stats.messages + ' messages, containing ' + stats.characters + ' characters, ' + stats.words + ' words and ' + stats.smileys + ' smileys; ' + stats.actions + ' of those messages were ACTIONs.');
                event.channel.say('There have been ' + stats.joins + ' joins, ' + stats.parts + ' parts, ' + stats.quits + ' quits, ' + stats.kicks + ' kicks, ' + stats.modes + ' mode changes, and ' + stats.topicchanges + ' topic changes.');
                event.channel.say('There are currently ' + Object.keys(event.channel.getNames()).length + ' users and the channel has peaked at ' + stats.peak.split(',')[0] + ' users.');
            });
        });
    };
};
/*
On #pupskuchen there have been 192008 messages, containing 5725313 characters, 891023 words, 15583 smileys, and 11788 frowns; 199 of those messages were ACTIONs. 
There have been 10624 joins, 183 parts, 0 quits, 44 kicks, 1313 mode changes, and 42 topic changes. 
There are currently 18 users and the channel has peaked at 0 users.
*/