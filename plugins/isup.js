var ping = require('jjg-ping');

exports.register = function (glados, next) {

    glados.hear(/^!isup( .*)?$/i, function (match, event) {
        var target = match[1] ? match[1].trim() : null;
        if (!target) {
            return event.user.notice('Benutze: !isup <URL/IP>');
        }
        return ping.system.ping(target, function (latency, status) {
            if (status) {
                return event.channel.reply(event.user, target + ' ist erreichbar! (' + latency + 'ms ping)');
            }
            return event.channel.reply(event.user, target + ' scheint nicht erreichbar zu sein.');
        });
    });


    return next();
};
exports.info = {
    name: 'isup',
    displayName: 'Isup',
    desc: ['Online-Check und Antwortzeit für URL/IP-Adressen.'],
    version: '1.0.0',
    commands: [{
        name: 'isup',
        params: {
            'URL oder IP': 'required'
        },
        desc: ['Prüft die Verfügbarkeit der URL/IP und gibt die Antwortzeit in Millisekunden zurück.']
    }]
};