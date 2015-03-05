var utils = require('../utils');

module.exports = function () {
    return function (connection) {

        connection.part = function (channels, msg) {
            channels = utils.toArray(channels).map(function (c) {
                return connection.isChannel(c) ? c.getName() : c;
            }).join(',');
            msg = msg || '';
            connection.write('PART ' + channels + ' :' + msg);
        };

        connection.on('data', function (message) {
            if (message.command === 'PART') {
                var channelList, reason;
                channelList = message.params;
                reason = channelList.pop();
                channelList = channelList.map(function (chan) {
                    return connection.getChannel(chan);
                });
                connection.emit('part', {
                    'user': connection.getUser(message.parseHostmaskFromPrefix().nickname),
                    'channels': channelList,
                    'message': reason
                });
            }
        });
    };
};
