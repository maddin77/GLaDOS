var _ = require('underscore');

module.exports = function (scriptLoader) {
    var smileys, smileyRegexp, countSmileys, statsdb, stats;

    statsdb = scriptLoader.database('stats');
    statsdb[scriptLoader.connection.getId()] = statsdb[scriptLoader.connection.getId()] || {};
    statsdb.save();

    stats = {
        set: function (namespace, key, value) {
            statsdb[scriptLoader.connection.getId()][namespace]         = statsdb[scriptLoader.connection.getId()][namespace] || {};
            statsdb[scriptLoader.connection.getId()][namespace][key]    = value;
            statsdb.save();
        },
        get: function (namespace, key) {
            statsdb[scriptLoader.connection.getId()][namespace] = statsdb[scriptLoader.connection.getId()][namespace] || {};
            return statsdb[scriptLoader.connection.getId()][namespace][key];
        },
        add: function (namespace, key, ammount) {
            this.set(namespace, key, (this.get(namespace, key) || 0) + ammount);
        }
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
        return '(' + smiley.replace(/[\[\]{}()*+?.\\|\^$\-,&#\s]/g, '\\$&') + ')';
    }).join('|'), 'gi');

    countSmileys = function (msg) {
        return (msg.match(smileyRegexp) || []).length;
    };

    scriptLoader.on('message', function (event) {
        stats.add(event.channel.getName(), 'messages', 1);
        stats.add(event.channel.getName(), 'characters', event.message.length);
        stats.add(event.channel.getName(), 'words', event.message.split(' ').length);
        stats.add(event.channel.getName(), 'smileys', countSmileys(event.message));
        if (event.isAction) {
            stats.add(event.channel.getName(), 'actions', 1);
        }
        if (event.message.match(/(http|ftp|https):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@?\^=%&amp;:\/~\+#]*[\w\-\@?\^=%&amp;\/~\+#])?/i)) {
            stats.add(event.channel.getName(), 'urls', 1);
        }
        if (event.message.toUpperCase() === event.message) {
            stats.add(event.channel.getName(), 'allcaps', 1);
        }
        if (event.message.slice(-1) === '?') {
            stats.add(event.channel.getName(), 'questions', 1);
        }
    });
    scriptLoader.on('allcommands', function (name, event) {
        stats.add(event.channel.getName(), 'commands', 1);
    });
    scriptLoader.on('join', function (event) {
        if (event.user.getNick() === scriptLoader.connection.config.nick && !stats.get(event.channel.getName(), 'start')) {
            stats.set(event.channel.getName(), 'start', Date.now());
        }

        stats.add(event.channel.getName(), 'joins', 1);

        var count = Object.keys(event.channel.getNames()).length;
        if (!stats.get(event.channel.getName(), 'peak') || count > stats.get(event.channel.getName(), 'peak').users) {
            stats.set(event.channel.getName(), 'peak', {
                'users': count,
                'timestamp': Date.now()
            });
        }
    });
    scriptLoader.on('names', function (event) {
        var count = Object.keys(event.channel.getNames()).length;
        if (!stats.get(event.channel.getName(), 'peak') || count > stats.get(event.channel.getName(), 'peak').users) {
            stats.set(event.channel.getName(), 'peak', {
                'users': count,
                'timestamp': Date.now()
            });
        }
    });
    scriptLoader.on('part', function (event) {
        event.channels.forEach(function (channel) {
            stats.add(channel.getName(), 'parts', 1);
        });
    });
    scriptLoader.on('kick', function (event) {
        stats.add(event.channel.getName(), 'kicks', 1);
    });
    scriptLoader.on('mode', function (event) {
        if (event.channel !== null) {
            stats.add(event.channel.getName(), 'modes', 1);
            if (event.mode === 'b') {
                stats.add(event.channel.getName(), 'bans', 1);
            }
        }
    });
    scriptLoader.on('topic', function (event) {
        if (event.topicChanged) {
            stats.add(event.channel.getName(), 'topicchanges', 1);
        }
    });
    scriptLoader.on('command', 'stats', function (event) {
        var s = _.defaults(statsdb[scriptLoader.connection.getId()][event.channel.getName()] || {}, {
            'joins': '0',
            'start': '1395000994802',
            'peak': {
                'users': 0,
                'timestamp': Date.now()
            },
            'messages': '0',
            'characters': '0',
            'words': '0',
            'smileys': '0',
            'questions': '0',
            'allcaps': '0',
            'modes': '0',
            'commands': '0',
            'kicks': '0',
            'urls': '0',
            'actions': '0',
            'bans': '0',
            'parts': '0',
            'quits': '0',
            'topicchanges': '0'
        });
        event.channel.say('On ' + event.channel.getName() + ' there have been ' + s.messages + ' messages, containing ' + s.characters + ' characters, ' + s.words + ' words and ' + s.smileys + ' smileys; ' + s.actions + ' of those messages were ACTIONs.');
        event.channel.say('There have been ' + s.joins + ' joins, ' + s.parts + ' parts, ' + s.quits + ' quits, ' + s.kicks + ' kicks, ' + s.modes + ' mode changes, and ' + s.topicchanges + ' topic changes.');
        event.channel.say('There are currently ' + Object.keys(event.channel.getNames()).length + ' users and the channel has peaked at ' + new Date(s.peak.timestamp) + ' with ' + s.peak.users + ' users.');
    });
};
/*
On #pupskuchen there have been 192008 messages, containing 5725313 characters, 891023 words, 15583 smileys, and 11788 frowns; 199 of those messages were ACTIONs. 
There have been 10624 joins, 183 parts, 0 quits, 44 kicks, 1313 mode changes, and 42 topic changes. 
There are currently 18 users and the channel has peaked at 0 users.
*/