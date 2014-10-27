var util = require('util');

module.exports = function () {
    return function (connection) {

        connection.send = function (target) {
            if (typeof target !== 'string') {
                if (connection.isUser(target)) {
                    target = target.getNick();
                } else if (connection.isChannel(target)) {
                    target = target.getName();
                } else {
                    target = target.toString();
                }
            }

            var leading, maxlen, message, args = Array.prototype.slice.call(arguments);
            args.shift();
            message = util.format.apply(util, args);

            leading = 'PRIVMSG ' + target + ' :';
            maxlen = 512 -
                    (1 + connection.me.getNick().length + 1 + connection.me.getUsername().length + 1 + connection.me.getHostname().length + 1) -
                    leading.length -
                    2;
            /*jslint regexp: true*/
            message.match(new RegExp('.{1,' + maxlen + '}', 'g')).forEach(function (str) {
                if (str[0] === ' ') { //leading whitespace
                    str = str.substring(1);
                }
                if (str[str.length - 1] === ' ') { //trailing whitespace
                    str = str.substring(0, str.length - 1);
                }
                connection.write(leading + str);
            });
            /*jslint regexp: false*/
        };

        connection.on('data', function (message) {
            if (message.command === 'PRIVMSG') {
                var isAction = false,
                    text = message.params[1],
                    user = message.prefixIsHostmask() ? connection.getUser(message.parseHostmaskFromPrefix().nickname) : message.prefix;

                if (text.indexOf('\u0001ACTION') === 0) {
                    isAction = true;
                    text = text.slice(7, -1);
                }

                if (connection.me.getNick() === message.params[0]) {
                    connection.emit('privatemessage', {
                        'user': user,
                        'message': text,
                        'isAction': isAction
                    });
                    connection.conManager.emit('privatemessage', connection, {
                        'user': user,
                        'message': text,
                        'isAction': isAction
                    });
                } else if (!(text[0] === connection.config.callsign && !isAction)) {
                    connection.emit('message', {
                        'channel': connection.getChannel(message.params[0]),
                        'user': user,
                        'message': text,
                        'isAction': isAction
                    });
                    connection.conManager.emit('message', connection, {
                        'channel': connection.getChannel(message.params[0]),
                        'user': user,
                        'message': text,
                        'isAction': isAction
                    });
                }
            }
        });
    };
};
