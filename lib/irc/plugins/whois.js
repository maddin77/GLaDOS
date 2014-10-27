var _ = require('underscore');

function whois(target, fn) {
    var self = this;
    if (fn) {
        this.whoisCallbacks[target] = function (err, data) {
            delete self.whoisCallbacks[target];
            fn(err, data);
        };
    }
    this.write('WHOIS ' + target);
}

module.exports = function () {
    return function (connection) {
        var map = {};
        connection.whois = whois;
        connection.whoisCallbacks = {};

        connection.on('data', function (message) {
            var target, cb, user;
            switch (message.command) {
            case 'RPL_WHOISUSER':
                target = message.params[1];
                user = connection.getUser(target);

                map[target] = map[target] || {};
                map[target].nick = target;

                //reset to default values
                map[target].away = null;
                map[target].oper = false;
                map[target].account = null;
                map[target].registered = false;
                map[target].secure = false;

                map[target].username =  message.params[2];
                user.username =  message.params[2];

                map[target].hostname =  message.params[3];
                user.hostname =  message.params[3];

                map[target].realname = message.params[5];
                user.realname = message.params[5];
                break;
            case 'RPL_WHOISCHANNELS':
                target =  message.params[1];
                user = connection.getUser(target);

                map[target] = map[target] || {};

                map[target].channels = {};
                _.each(message.params[2].trim().split(' '), function (name) {
                    var match = name.match(/^((?:\!|\~|\&|\@|\%|\+)*)(\S+)$/);
                    map[target].channels[match[2]] = match[1].split('');
                });
                user.channels = map[target].channels;
                break;
            case 'RPL_WHOISSERVER':
                target = message.params[1];
                user = connection.getUser(target);

                map[target] = map[target] || {};

                map[target].server = message.params[2];
                user.server = message.params[2];

                map[target].serverInfo = message.params[3];
                user.serverInfo = message.params[3];
                break;
            case 'RPL_AWAY':
                target = message.params[1];

                map[target] = map[target] || {};

                user = connection.getUser(target);
                user.away = message.params[2];
                map[target].away = message.params[2];
                break;
            case 'RPL_WHOISOPERATOR':
                target = message.params[1];
                user = connection.getUser(target);

                map[target] = map[target] || {};

                map[target].oper = true;
                user.oper = true;
                break;
            case 'RPL_WHOISIDLE':
                target = message.params[1];
                user = connection.getUser(target);

                map[target] = map[target] || {};

                map[target].idle = parseInt(message.params[2], 10);
                user.idle = parseInt(message.params[2], 10);

                map[target].signon = new Date(parseInt(message.params[3], 10) * 1000);
                user.signon = new Date(parseInt(message.params[3], 10) * 1000);
                break;
            case '330':
                target = message.params[1];
                user = connection.getUser(target);

                if (message.params[3] === 'is logged in as') {
                    map[target] = map[target] || {};
                    user.account = message.params[2];
                    map[target].account = message.params[2];
                }
                break;
            case '307':
                target = message.params[1];
                user = connection.getUser(target);

                if (message.params[2] === 'is a registered nick') {
                    map[target] = map[target] || {};
                    user.registered = true;
                    map[target].registered = true;
                }
                break;
            case '671':
                target = message.params[1];
                user = connection.getUser(target);

                if (message.params[2] === 'is using a secure connection') {
                    map[target] = map[target] || {};
                    user.secure = true;
                    map[target].secure = true;
                }
                break;
            case 'RPL_ENDOFWHOIS':
                target = message.params[1];
                if (!map[target]) {
                    return;
                }
                cb = connection.whoisCallbacks[target];
                if (cb) {
                    cb(null, map[target]);
                } else {
                    connection.emit('whois', null, map[target]);
                    connection.conManager.emit('whois', connection, null, map[target]);
                }
                break;
            case 'ERR_NEEDMOREPARAMS':
                target = message.params[1];
                if (target !== 'WHOIS') {
                    return;
                }
                cb = connection.whoisCallbacks[target];
                if (cb) {
                    cb('Not enough parameters', null);
                } else {
                    connection.emit('whois', 'Not enough parameters', null);
                    connection.conManager.emit('whois', connection, 'Not enough parameters', null);
                }
                break;
            case 'ERR_NOSUCHSERVER':
                target = message.params[1];
                cb = connection.whoisCallbacks[target];
                if (cb) {
                    cb('No such server', null);
                } else {
                    connection.emit('whois', 'No such server', null);
                    connection.conManager.emit('whois', connection, 'No such server', null);
                }
                break;
            case 'ERR_NOSUCHNICK':
                target = message.params[1];
                cb = connection.whoisCallbacks[target];
                if (cb) {
                    cb('No such nick/channel', null);
                } else {
                    connection.emit('whois', 'No such nick/channel', null);
                    connection.conManager.emit('whois', connection, 'No such nick/channel', null);
                }
                break;
            }
        });
    };
};