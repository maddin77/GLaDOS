module.exports = function () {
    return function (connection) {
        connection.on('data', function (message) {
            if (message.command === 'RPL_AWAY') {
                connection.emit('away', {
                    'user': connection.getUser(message.params[1]),
                    'message': message.params[2]
                });
                connection.conManager.emit('away', connection, {
                    'user': connection.getUser(message.params[1]),
                    'message': message.params[2]
                });
            }
        });
    };
};
