'use strict';
var _ = require('underscore');
var debug = require('debug')('GLaDOS:script:stats');

module.exports = function (scriptLoader, irc) {
    var smileys, smileyRegexp, countSmileys, statsdb, statsAdd;

    statsdb = irc.database('stats');

    statsAdd = function (namespace, key, ammount) {
        statsdb[namespace] = statsdb[namespace] || {};
        statsdb[namespace][key] = (statsdb[namespace][key] || 0) + ammount;
        statsdb.save();
    };

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

    scriptLoader.registerEvent('message', function (event) {
        statsAdd(event.channel.getName(), 'messages', 1);
        statsAdd(event.channel.getName(), 'characters', event.message.length);
        statsAdd(event.channel.getName(), 'words', event.message.split(' ').length);
        statsAdd(event.channel.getName(), 'smileys', countSmileys(event.message));
        if (event.isAction) {
            statsAdd(event.channel.getName(), 'actions', 1);
        }
        if (event.message.match(/(http|ftp|https):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@?\^=%&amp;:\/~\+#]*[\w\-\@?\^=%&amp;\/~\+#])?/i)) {
            statsAdd(event.channel.getName(), 'urls', 1);
        }
        if (event.message.toUpperCase() === event.message) {
            statsAdd(event.channel.getName(), 'allcaps', 1);
        }
        if (event.message.slice(-1) === '?') {
            statsAdd(event.channel.getName(), 'questions', 1);
        }
    });
    scriptLoader.registerEvent('command', function (event) {
        statsAdd(event.channel.getName(), 'commands', 1);
    });
    scriptLoader.registerEvent('join', function (event) {
        statsdb[event.channel.getName()] = statsdb[event.channel.getName()] || {};

        if (event.user.getNick() === irc.config.irc.nick && !_.has(statsdb[event.channel.getName()], 'start')) {
            statsdb[event.channel.getName()].start = Date.now();
            statsdb.save();
        }

        statsAdd(event.channel.getName(), 'joins', 1);

        var count = Object.keys(event.channel.getNames()).length;
        if (!_.has(statsdb[event.channel.getName()], 'peak') || count > statsdb[event.channel.getName()].peak.users) {
            statsdb[event.channel.getName()].peak = {
                "users": count,
                "timestamp": Date.now()
            };
            statsdb.save();
        }
    });
    scriptLoader.registerEvent('names', function (event) {
        var count = Object.keys(event.channel.getNames()).length;
        if (!_.has(statsdb[event.channel.getName()], 'peak') || count > statsdb[event.channel.getName()].peak.users) {
            statsdb[event.channel.getName()].peak = {
                "users": count,
                "timestamp": Date.now()
            };
            statsdb.save();
        }
    });
    scriptLoader.registerEvent('part', function (event) {
        event.channels.forEach(function (channel) {
            statsAdd(channel.getName(), 'parts', 1);
        });
    });
    scriptLoader.registerEvent('kick', function (event) {
        statsAdd(event.channel.getName(), 'kicks', 1);
    });
    scriptLoader.registerEvent('mode', function (event) {
        if (event.channel !== null) {
            statsAdd(event.channel.getName(), 'modes', 1);
            if (event.mode === 'b') {
                statsAdd(event.channel.getName(), 'bans', 1);
            }
        }
    });
    scriptLoader.registerEvent('topic', function (event) {
        if (event.topicChanged) {
            statsAdd(event.channel.getName(), 'topicchanges', 1);
        }
    });
    scriptLoader.registerCommand('stats', function (event) {
        var stats = _.defaults(statsdb[event.channel.getName()] || {}, {
            "joins": "0",
            "start": "1395000994802",
            "peak": {
                "users": 0,
                "timestamp": Date.now()
            },
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
};
/*
On #pupskuchen there have been 192008 messages, containing 5725313 characters, 891023 words, 15583 smileys, and 11788 frowns; 199 of those messages were ACTIONs. 
There have been 10624 joins, 183 parts, 0 quits, 44 kicks, 1313 mode changes, and 42 topic changes. 
There are currently 18 users and the channel has peaked at 0 users.
*/