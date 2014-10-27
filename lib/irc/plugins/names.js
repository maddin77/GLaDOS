var _ = require('underscore');

function names(channel, fn) {
    var self = this;
    channel = this.isChannel(channel) ? channel.getName() : channel.toLowerCase();

    this.nameCallbacks[channel] = function (names) {
        delete self.nameCallbacks[channel];
        fn(names);
    };
    this.write('NAMES ' + channel);
}

module.exports = function () {
    return function (connection) {
        var nameReply = {};

        connection.names = names;
        connection.nameCallbacks = {};

        connection.on('data', function (message) {
            var channelName, channel, cb;
            if (message.command === 'RPL_NAMREPLY') {
                channelName = message.params[2];
                nameReply[channelName] = nameReply[channelName] || {};
                _.each(message.params[3].trim().split(' '), function (name) {
                    var match = name.match(/^((?:\!|\~|\&|\@|\%|\+)*)(\S+)$/);
                    nameReply[channelName][match[2]] = match[1].split('');
                });
            } else if (message.command === 'RPL_ENDOFNAMES') {
                channelName = message.params[1];
                channel = connection.getChannel(channelName);
                cb = connection.nameCallbacks[channelName];
                channel.names = nameReply[channelName];
                if (cb) {
                    cb(nameReply[channelName]);
                } else {
                    connection.emit('names', {
                        'channel': channel,
                        'names': nameReply[channelName]
                    });
                    connection.conManager.emit('names', connection, {
                        'channel': channel,
                        'names': nameReply[channelName]
                    });
                }
                delete nameReply[channelName];
            }
        });
    };
};
