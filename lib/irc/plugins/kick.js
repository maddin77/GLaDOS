var utils   = require('../utils');

module.exports = function () {
    return function (connection) {

        connection.kick = function (channels, users, msg) {
            channels = utils.toArray(channels).map(function (c) {
                return connection.isChannel(c) ? c.getName() : c;
            }).join(',');
            users = utils.toArray(users).map(function (u) {
                return connection.isUser(u) ? u.getNick() : u;
            }).join(',');
            connection.write('KICK ' + channels + ' ' + users + ' :' + msg);
        };

        connection.on('data', function (message) {
            if (message.command === 'KICK') {
                connection.emit('kick', {
                    'channel': connection.getChannel(message.params[0].toLowerCase()),
                    'user': connection.getUser(message.params[1]),
                    'by': message.parseHostmaskFromPrefix() ? connection.getUser(message.parseHostmaskFromPrefix().nickname) : connection.getUser(),
                    'reason': message.params[2]
                });
            }
        });
    };
};
