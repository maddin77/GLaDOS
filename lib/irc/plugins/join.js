var utils = require('../utils');

module.exports = function () {
    return function (connection) {

        connection.join = function (channels) {
            channels = utils.toArray(channels).map(function (c) {
                return connection.isChannel(c) ? c.getName() : c;
            }).join(',');
            connection.write('JOIN ' + channels);
        };

        connection.on('data', function (message) {
            if (message.command === 'JOIN') {
                connection.emit('join', {
                    'user': connection.getUser(message.parseHostmaskFromPrefix().nickname),
                    'channel': connection.getChannel(message.params[0])
                });
            }
        });
    };
};
