module.exports = function () {
    return function (connection) {
        connection.on('data', function (message) {
            if (message.command === 'RPL_WELCOME') {
                connection.me.nick = message.params[0];
                connection.emit('welcome', {
                    'nick': message.params[0],
                    'message': message.params[1]
                });
                connection.conManager.emit('welcome', connection, {
                    'nick': message.params[0],
                    'message': message.params[1]
                });
            }
        });
    };
};
