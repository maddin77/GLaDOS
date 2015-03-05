module.exports = function () {
    return function (connection) {

        connection.invite = function (name, channel) {
            name = typeof name === 'string' ? name : name.getNick();
            connection.write('INVITE ' + name + ' ' + channel);
        };

        connection.on('data', function (message) {
            if (message.command === 'INVITE') {
                connection.emit('invite', {
                    'channel': connection.getChannel(message.params[1]),
                    'user': connection.getUser(message.parseHostmaskFromPrefix().nickname),
                    'target': connection.getUser(message.params[0])
                });
            }
        });
    };
};
