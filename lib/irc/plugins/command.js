module.exports = function () {
    return function (connection) {
        connection.on('data', function (message) {
            if (message.command === 'PRIVMSG') {
                var text, eventObject = {};

                text = message.params[1];

                if (text.indexOf('\u0001ACTION') === 0) {
                    return;
                }

                if (text.substr(0, connection.config.callsign.length) !== connection.config.callsign) {
                    return;
                }

                eventObject.channel = connection.getChannel(message.params[0]);
                eventObject.user = message.prefixIsHostmask() ? connection.getUser(message.parseHostmaskFromPrefix().nickname) : message.prefix;
                eventObject.message = text;
                eventObject.name = text.split(' ')[0].substr(1).toLowerCase();
                eventObject.text = text.substr(connection.config.callsign.length + eventObject.name.length + 1);
                eventObject.params = eventObject.text.length === 0 ? [] : eventObject.text.split(' ');

                connection.emit('allcommands', eventObject.name, eventObject);
                connection.emit('command:' + eventObject.name, eventObject);
                connection.getConnectionManager().emit('allcommands', eventObject.name, connection, eventObject);
                connection.getConnectionManager().emit('command:' + eventObject.name, connection, eventObject);
            }
        });
    };
};
