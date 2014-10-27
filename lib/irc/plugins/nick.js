module.exports = function () {
    return function (connection) {

        connection.nick = function (nick) {
            connection.write('NICK ' + nick);
        };

        connection.on('data', function (message) {
            if (message.command === 'NICK') {
                var user, oldNick;
                if (message.prefix.length === 0) {
                    user = connection.me;
                } else {
                    user = connection.getUser(message.parseHostmaskFromPrefix().nickname);
                }
                oldNick = user.getNick();
                user.nick = message.params[0];

                if (oldNick === connection.me.getNick()) {
                    connection.me.nick = user.getNick();
                }

                connection.emit('nick', {
                    'user': user,
                    'oldNick': oldNick
                });
                connection.conManager.emit('nick', connection, {
                    'user': user,
                    'oldNick': oldNick
                });
            }
            if (message.command === 'ERR_NICKNAMEINUSE') {
                connection.nick(connection.getUser().getNick() + '_');
            }
        });
    };
};
