module.exports = function () {
    return function (connection) {
        connection.on('data', function (message) {
            if (message.command === 'PING') {
                connection.write('PONG :' + message.params[0]);
                connection.emit('ping');
                connection.conManager.emit('ping', connection);
            }
        });
    };
};
