var minimatch = require('minimatch');
var yargs = require('yargs');
var shortid = require('shortid');
var _ = require('lodash');

//TODO: event alternative zu msg (join/part etc)

exports.register = function (glados, next) {
    var database = [];
    database = glados.brain('react')('react').cloneDeep();

    glados.hear(/^!react( .+)?$/i, function (match, event) {
        var str = match[0];
        str = str.trim();
        str = str.replace(/^!react /i, '');
        str = str.match(/\"([^"]+)\"|((?:\-{0,2})\S+)+/gi).map(function (s) {
            if (s[0] === '"') {
                s = s.substr(1);
            }
            if (s[s.length - 1] === '"') {
                s = s.slice(0, -1);
            }
            return s;
        });

        var args = yargs(str)
            .option('global', {
                alias : 'g',
                demand: false,
                default: false,
                type: 'boolean'
            })
            .option('user', {
                alias : 'u',
                demand: false,
                default: '*',
                type: 'string'
            })
            .option('message', {
                alias : 'm',
                demand: false,
                default: '',
                type: 'string'
            })
            .option('join', {
                alias : 'j',
                demand: false,
                default: false,
                type: 'boolean'
            })
            .option('part', {
                alias : 'p',
                demand: false,
                default: false,
                type: 'boolean'
            })
            .option('kick', {
                alias : 'k',
                demand: false,
                default: false,
                type: 'boolean'
            })
            .option('response', {
                alias : 'r',
                demand: true,
                type: 'string'
            })
            .option('delete', {
                alias : 'd',
                demand: false,
                type: 'string'
            })
            .fail(function () {
                return true;
            })
            .showHelpOnFail(false, 'Hilfe: ' + glados.getWeburl() + '/plugins#react-react')
            .exitProcess(false)
            .argv;

        if (_.has(args, 'delete') && args.delete) {
            var react = _.findWhere(database, {id: args.delete});
            if (!react) {
                return event.user.notice('Ungültige ID.');
            }
            if (!event.user.isAdmin() && react.by !== event.user.getNick()) {
                return event.user.notice('Du hast nicht die nötigen Rechte diese Reaktion zu löschen.');
            }
            glados.brain('react')('react').chain().remove({id: args.delete}).value();
            setTimeout(function () {
                database = glados.brain('react')('react').cloneDeep();
                event.channel.reply(event.user, 'Reaktion "' + args.delete + '" erfolgreich gelöscht.');
            }, 500);
            return;
        }

        if (!_.isString(args.response) || args.response.length === 0) {
            return event.user.notice('Fehler: "--response" Parameter wird erwartet und darf nicht leer sein.') &&
                event.user.notice('Hilfe: ' + glados.getWeburl() + '/plugins#react-react');
        }

        if (args.message.length === 0 && !args.join && !args.part && !args.kick) {
            return event.user.notice('Fehler: "--message", "--join", "--part" oder "--kick" Parameter wird erwartet.') &&
                event.user.notice('Hilfe: ' + glados.getWeburl() + '/plugins#react-react');
        }


        /*if (!_.has(args, 'response') || !_.has(args, 'global') || !_.has(args, 'user') || !_.has(args, 'message')) {
            return event.user.notice('Hilfe: ' + glados.getWeburl() + '/plugins#react-react');
        }*/


        if (args.global && !event.user.isAdmin()) {
            return event.user.notice('Du bist nicht berechtigt diesen Befehl für alle Channel zu nutzen.');
        } else if (!event.channel.userHasMinMode(event.user, '%')) {
            return event.user.notice('Du bist nicht berechtigt diesen Befehl in diesem Channel zu nutzen.');
        }

        var id = shortid.generate();

        glados.brain('react')('react').push({
            id: id,
            by: event.user.getNick(),
            time: new Date().toString(),
            channel: args.global ? '*' : event.channel.getName(),
            user: args.user,
            message: args.message,
            join: args.join,
            part: args.part,
            kick: args.kick,
            response: args.response,
        });
        setTimeout(function () {
            database = glados.brain('react')('react').cloneDeep();
            event.channel.reply(event.user, 'Reaktion erfolgreich erstellt. ID: ' + id);
        }, 500);
    });

    glados.on('kick', function (event) {
        var matched = _.filter(database, function (t) {
            if (!t.kick) {
                return false;
            }
            if (t.channel !== '*' && t.channel !== event.channel.getName()) {
                glados.debug('!channel', t.channel, event.channel.getName());
                return false;
            }
            if (t.user !== '*' && t.user.toLowerCase() !== event.user.getNick().toLowerCase()) {
                glados.debug('!user', t.user, event.user.getNick());
                return false;
            }
            return true;
        });
        _.each(matched, function (t) {
            var msg = t.response;
            msg = msg.replace(/{u}/gi, event.user.getNick());
            msg = msg.replace(/{c}/gi, event.channel.getName());
            msg = msg.replace(/{m}/gi, event.reason);
            event.channel.say(msg);
        });
    });

    glados.on('part', function (event) {
        _.each(event.channels, function (channel) {
            var matched = _.filter(database, function (t) {
                if (!t.part) {
                    return false;
                }
                if (t.channel !== '*' && t.channel !== channel.getName()) {
                    glados.debug('!channel', t.channel, channel.getName());
                    return false;
                }
                if (t.user !== '*' && t.user.toLowerCase() !== event.user.getNick().toLowerCase()) {
                    glados.debug('!user', t.user, event.user.getNick());
                    return false;
                }
                return true;
            });
            _.each(matched, function (t) {
                var msg = t.response;
                msg = msg.replace(/{u}/gi, event.user.getNick());
                msg = msg.replace(/{c}/gi, channel.getName());
                msg = msg.replace(/{m}/gi, event.message);
                channel.say(msg);
            });
        });
    });

    glados.on('join', function (event) {
        var matched = _.filter(database, function (t) {
            if (!t.join) {
                return false;
            }
            if (t.channel !== '*' && t.channel !== event.channel.getName()) {
                glados.debug('!channel', t.channel, event.channel.getName());
                return false;
            }
            if (t.user !== '*' && t.user.toLowerCase() !== event.user.getNick().toLowerCase()) {
                glados.debug('!user', t.user, event.user.getNick());
                return false;
            }
            return true;
        });
        _.each(matched, function (t) {
            var msg = t.response;
            msg = msg.replace(/{u}/gi, event.user.getNick());
            msg = msg.replace(/{c}/gi, event.channel.getName());
            event.channel.say(msg);
        });
    });

    glados.on('message', function (event) {

        var matched = _.filter(database, function (t) {
            if (t.message.length === 0) {
                return false;
            }
            if (t.channel !== '*' && t.channel !== event.channel.getName()) {
                glados.debug('!channel', t.channel, event.channel.getName());
                return false;
            }
            if (t.user !== '*' && t.user.toLowerCase() !== event.user.getNick().toLowerCase()) {
                glados.debug('!user', t.user, event.user.getNick());
                return false;
            }
            if (t.message !== '*' && !minimatch(event.message, t.message, {
                noglobstar: true,
                dot: true,
                nocase: true,
                nocomment: true
            })) {
                glados.debug('!message', t.message, event.message);
                return false;
            }
            return true;
        });

        _.each(matched, function (t) {
            var msg = t.response;
            msg = msg.replace(/{u}/gi, event.user.getNick());
            msg = msg.replace(/{c}/gi, event.channel.getName());
            msg = msg.replace(/{m}/gi, event.message);
            event.channel.say(msg);
        });
    });

    //========
    glados.web().route({
        path: '/react',
        method: 'GET',
        handler: function (request, reply) {
            return reply.view('react', {
                mainnav: '/react',
                react: database.map(function (r) {
                    r.time = new Date(r.time);
                    return r;
                })
            });
        }
    });
    return next();
};
exports.info = {
    name: 'react',
    displayName: 'React',
    desc: [
        'Reagiert auf bestimmte Muster. Kann nur von Channel Moderatoren (HOP und höher) genutzt werden.',
        'Parameter mit mehr als einem Wort müssen in <code>""</code> geschrieben werden.',
        'Eine Liste mit allen aktuellen reaktionen findest du <a href="/react">hier</a>.'
    ],
    version: '1.0.0',
    commands: [{
        name: 'react',
        params: {
            '-g, --global': 'cli',
        },
        desc: ['<strong>(Optional)</strong> Aktiviert die Regel in allen Channeln. Kann nur von Administratoren benutzt werden. Standardwert ist <code>false</code> (nur aktueller Channel).']
    }, {
        name: 'react',
        params: {
            '-u, --user': 'cli'
        },
        desc: ['<strong>(Optional)</strong> Reagiert nur auf Aktionen des Users. Groß- und Kleinschreibung wird nicht beachtet. Standardwert ist <code>*</code> (Alle Benutzer).']
    }, {
        name: 'react',
        params: {
            '-m, --message': 'cli'
        },
        desc: ['<strong>(Optional)</strong> Reagiert auf eine bestimme Nachricht. Groß- und Kleinschreibung wird nicht beachtet. Unterstützt glob ausdrücke. Kein Standardwert (Reagiert nicht auf Nachrichten).']
    }, {
        name: 'react',
        params: {
            '-j, --join': 'cli'
        },
        desc: ['<strong>(Optional)</strong> Reagiert auf das betreten des Channels. Standardwert ist <code>false</code> (Reagiert nicht auf JOINs).']
    }, {
        name: 'react',
        params: {
            '-p, --part': 'cli'
        },
        desc: ['<strong>(Optional)</strong> Reagiert auf das verlassen des Channels. Standardwert ist <code>false</code> (Reagiert nicht auf PARTs).']
    }, {
        name: 'react',
        params: {
            '-k, --kick': 'cli'
        },
        desc: ['<strong>(Optional)</strong> Reagiert wenn jemand aus dem Channel gekickt wird. Standardwert ist <code>false</code> (Reagiert nicht auf KICKs).']
    }, {
        name: 'react',
        params: {
            '-r, --response': 'cli'
        },
        desc: [
            '<strong>(Erforderlich)</strong> Die Nachrict die ausgegeben werden soll. Kein Standardwert.',
            '<code>{u}</code> wird durch den Nicknamen desjenigen ersetzt, der die Reaktion auslöst.',
            '<code>{c}</code> wird durch den Channel ersetzt, indem die Reaktion ausgelöst wird.',
            '<code>{m}</code> wird durch die Nachricht ersetzt wenn --message gesetzt wurde, Oder durch den Grund bei --part bzw --kick.'
        ]
    }]
};
