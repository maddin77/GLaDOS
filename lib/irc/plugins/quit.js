module.exports = function () {
    return function (connection) {

        connection.quit = connection.disconnect;

        connection.on('data', function (message) {
            if (message.command === 'QUIT') {
                connection.emit('quit', {
                    'user': message.prefixIsHostmask() ? connection.getUser(message.parseHostmaskFromPrefix().nickname) : connection.me,
                    'message': message.params[0]
                });
                connection.conManager.emit('quit', connection, {
                    'user': message.prefixIsHostmask() ? connection.getUser(message.parseHostmaskFromPrefix().nickname) : connection.me,
                    'message': message.params[0]
                });
            }
        });
    };
};
