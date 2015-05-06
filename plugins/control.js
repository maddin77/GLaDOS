var path    = require('path');
var _       = require('lodash');
var numeral = require('numeral');
var os      = require('os');

exports.register = function (glados, next) {
    glados.on('invite', function (event) {
        if (event.target.getNick() === this.me.getNick()) {
            this.join(event.channel.getName());
            this.config('channels').push({ name: event.channel.getName() });
        }
    });
    glados.on('kick', function (event) {
        if (event.user.getNick() === this.me.getNick()) {
            this.config('channels').remove({ name: event.channel.getName() });
        }
    });

    glados.hear(/^!version$/i, function (match, event) {
        var p = require(path.join(__dirname, '..', 'package.json'));
        event.user.notice(p.name + ' - ' + p.version);
    });
    /*glados.hear(/^!sinfo$/i, function (match, event) {
        if (!event.user.isAdmin()) {
            return event.user.notice('Nein (ಠ_ಠ)');
        }
        var s = glados.generateSession(event.user.getNick());
        event.user.notice('Eine Session wurde auf deinen Nick (%s) registriert. Du kannst dich nun über folgenden Link anmelden:', s.nick);
        event.user.notice(glados.getWeburl() + '/sinfo/?sid=' + s.sid);
        event.user.notice('Der Link kann ein mal genutzt werden und verfällt automatisch in 60 Sekunden.');
    });*/
    glados.hear(/^!join( .+)?$/i, function (match, event) {
        if (!event.user.isAdmin()) {
            return event.user.notice('Du hast nicht die nötigen Rechte um diesen Befehl nutzen zu können.');
        }
        var chans = match[1];
        if (!chans) {
            return event.user.notice('Benutze: !join <#channel> [#channel ...]');
        }
        chans = chans.trim().split(' ');
        this.join(chans);
        _.each(chans, function (c) {
            this.config('channels').push({ name: c });
        }, this);
    });
    glados.hear(/^!part( \S+(.+)?)?$/i, function (match, event) {
        if (!event.user.isAdmin()) {
            return event.user.notice('Du hast nicht die nötigen Rechte um diesen Befehl nutzen zu können.');
        }
        var chan = match[1] ? match[1].trim() : event.channel.getName();
        var msg = match[2] ? match[2].trim() : 'Bye';

        this.part(chan, msg);
        this.config('channels').remove({ name: chan });
    });
    glados.hear(/^!(?:cycle|rejoin)( \S+)?( .+)?$/i, function (match, event) {
        if (!event.user.isAdmin()) {
            return event.user.notice('Du hast nicht die nötigen Rechte um diesen Befehl nutzen zu können.');
        }
        var chan = match[1] ? match[1].trim() : event.channel.getName();
        var msg = match[2] ? match[2].trim() : 'brb';

        this.part(chan, msg);
        this.join(chan);
    });
    glados.hear(/^!raw( .+)?$/i, function (match, event) {
        if (!event.user.isAdmin()) {
            return event.user.notice('Du hast nicht die nötigen Rechte um diesen Befehl nutzen zu können.');
        }
        if (!match[1]) {
            return event.user.notice('Benutze: !raw <Befehl>');
        }
        this.write(match[1].trim());
    });
    glados.hear(/^!disconnect( .+)?$/i, function (match, event) {
        if (!event.user.isAdmin()) {
            return event.user.notice('Du hast nicht die nötigen Rechte um diesen Befehl nutzen zu können.');
        }
        var msg = match[1] ? match[1].trim() : null;
        this.disconnect(msg);
    });
    glados.hear(/^!exit( .+)?$/i, function (match, event) {
        if (!event.user.isAdmin()) {
            return event.user.notice('Du hast nicht die nötigen Rechte um diesen Befehl nutzen zu können.');
        }
        var msg = match[1] ? match[1].trim() : null;
        this.disconnect(msg, function () {
            process.exit(0);
        });
    });
    glados.hear(/^!reconnect( .+)?$/i, function (match, event) {
        if (!event.user.isAdmin()) {
            return event.user.notice('Du hast nicht die nötigen Rechte um diesen Befehl nutzen zu können.');
        }
        var msg = match[1] ? match[1].trim() : null;
        var that = this;
        this.disconnect(msg, function () {
            that.connect();
        });
    });
    glados.hear(/^!(?:say|msg)( \S+)?( .+)?$/i, function (match, event) {
        if (!event.user.isAdmin()) {
            return event.user.notice('Du hast nicht die nötigen Rechte um diesen Befehl nutzen zu können.');
        }
        var target = match[1] ? match[1].trim() : null;
        var message = match[2] ? match[2].trim() : null;
        if (!target || !message) {
            return event.user.notice('Benutze: !say <#channel/Nick> <Nachricht>');
        }
        this.send(match[1].trim(), match[2].trim());
    });



    /*glados.web().route({
        path: '/sinfo',
        method: 'GET',
        handler: function (request, reply) {
            if (!request.state.admin) {
                return reply.redirect('/');
            }
            var mem = process.memoryUsage();
            return reply.view('sinfo', {
                mainnav: '/sinfo',
                process: {
                    platform: process.platform,
                    arch: process.arch,
                    uptime: numeral(process.uptime()).format('00:00:00'),
                    pid: process.pid,
                    gid: process.getgid(),
                    uid: process.getuid(),
                    versions: process.versions,
                    mem: {
                        rss: numeral(mem.rss).format('0.000 b'),
                        heapTotal: numeral(mem.heapTotal).format('0.000 b'),
                        heapUsed: numeral(mem.heapUsed).format('0.000 b')
                    },
                    cwd: process.cwd(),
                    argv: _.drop(process.argv, 2),
                    execPath: process.execPath,
                    execArgv: process.execArgv
                },
                os: {
                    hostname: os.hostname(),
                    type: os.type(),
                    release: os.release(),
                    uptime: numeral(os.uptime()).format('00:00:00'),
                    loadavg: os.loadavg(),
                    totalmem: numeral(os.totalmem()).format('0.000 b'),
                    freemem: numeral(os.freemem()).format('0.000 b'),
                    cpus: os.cpus()
                }
            });
        }
    });*/
    return next();
};
exports.info = {
    name: 'control',
    displayName: 'GLaDOS Kontrolle',
    desc: ['Bietet verschiedene Befehle um GLaDOS zu kontrollieren.'],
    version: '1.0.0',
    commands: [{
        name: 'version',
        desc: ['Gibt die aktuelle Version via notice zurück.']
    },{
        name: 'sinfo',
        desc: [
            'Erstellt eine Admin Session zum einsehen der Systeminformationen.',
            'Kann nur von Administratoren genutzt werden.'
        ]
    },{
        name: 'join',
        params: {
            'Channel': 'required',
            'Channel ...': 'optional'
        },
        desc: [
            'Lässt GLaDOS den oder die angegebenen Channel betreten.',
            'Mehrere Channel müssen durch ein Leerzeichen getrennt werden.',
            'Kann nur von Administratoren genutzt werden.'
        ]
    },{
        name: 'part',
        params: {
            'Channel': 'optional',
            'Nachricht': 'optional'
        },
        desc: [
            'Lässt GLaDOS einen Channel verlassen.',
            'Wird kein Channel angegeben, so wird der Channel verlassen in dem der Befehl ausgeführt wurde.',,
            'Optional kann auch noch eine Nachricht angegeben werden, die in der PART-nachricht angegeben wird.',
            'Kann nur von Administratoren genutzt werden.'
        ]
    },{
        name: 'rejoin',
        alias: ['cycle'],
        params: {
            'Channel': 'optional',
            'Nachricht': 'optional'
        },
        desc: [
            'Lässt GLaDOS Einen Channel verlassen und wieder betreten.',
            'Wird kein Channel angegeben, so wird der Channel verlassen/betreten in dem der Befehl ausgeführt wurde.',
            'Optional kann auch noch eine Nachricht angegeben werden, die in der PART-nachricht angegeben wird.',
            'Kann nur von Administratoren genutzt werden.'
        ]
    },{
        name: 'raw',
        params: {
            'Befehl': 'required'
        },
        desc: [
            'Sendet den angegebenen Befehl direkt an den IRC Server.',
            'Kann nur von Administratoren genutzt werden.'
        ]
    },{
        name: 'exit',
        params: {
            'Nachricht': 'optional'
        },
        desc: [
            'Beendet die Verbindung zum IRC Server und beendet danach den Prozess.',
            'Optional kann eine Nachricht angegeben werden die beim verlassen angezegit wird.',
            'Kann nur von Administratoren genutzt werden.'
        ]
    },{
        name: 'diconnect',
        params: {
            'Nachricht': 'optional'
        },
        desc: [
            'Beendet die Verbindung zum IRC Server.',
            'Kann nur von Administratoren genutzt werden.'
        ]
    },{
        name: 'reconnect',
        params: {
            'Nachricht': 'optional'
        },
        desc: [
            'Beendet die Verbindung zum IRC Server und stellt danach eine neue Verbindung her.',
            'Kann nur von Administratoren genutzt werden.'
        ]
    },{
        name: 'say',
        alias: ['msg'],
        params: {
            'Empfänger': 'required',
            'Nachricht': 'required'
        },
        desc: [
            'Sendet eine Nachricht an einen Empfänger im IRC.',
            'Der Empfänger kann entweder ein Channel oder ein Benutzer sein.',
            'Kann nur von Administratoren genutzt werden.'
        ]
    }]
};