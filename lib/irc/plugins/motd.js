module.exports = function () {
    return function (connection) {
        var motd = [];
        connection.on('data', function (message) {
            if (message.command === 'RPL_MOTDSTART') {
                motd = [message.params[1]];
            } else if (message.command === 'RPL_MOTD') {
                motd.push(message.params[1]);
            } else if (message.command === 'ERR_NOMOTD' || message.command === 'RPL_ENDOFMOTD') {
                motd.push(message.params[1]);
                connection.emit('motd', motd);
                motd = [];
            }
        });
    };
};
