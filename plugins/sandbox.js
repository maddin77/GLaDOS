var Sandbox = require('sandbox');

exports.register = function (glados, next) {
    var sandbox = new Sandbox();
    glados.hear(/^!(?:sandbox|c|calc|calculate|math)( .+)?$/i, function (match, event) {
        var string = match[1] ? match[1].trim() : null;
        if (!string) {
            return event.user.notice('Benutze: !sandbox <Code>');
        }
        return sandbox.run(string, function (output) {
            event.channel.reply(event.user, output.result);
        });
    });


    return next();
};
exports.info = {
    name: 'sandbox',
    displayName: 'Sandbox',
    desc: ['JS-Code im Sandkasten.'],
    version: '1.0.0',
    commands: [{
        name: 'sandbox',
        alias: ['calculate', 'calc', 'math', 'c'],
        params: {
            'Code': 'required'
        },
        desc: ['Führt den Javascript Code in einer Sandbox aus und liefert das Ergebniss (wenn möglich) zurück.']
    }]
};