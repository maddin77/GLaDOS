var path        = require('path');

exports.register = function (glados, next) {


    glados.hear(/^!version/, function (match, event, client) {
        var p = require(path.join(__dirname, '..', 'package.json'));
        client.irc.notice(event.nickname, p.name + ' - v' + p.version);
    });

    glados.hear(/^!sinfo/, function (match, event, client) {
        if (glados.isAdmin(event.nickname, client)) {
            //TODO:
        }
    });

    return next();
};
exports.attributes = {
    name: 'control',
    version: '1.0.0',
};