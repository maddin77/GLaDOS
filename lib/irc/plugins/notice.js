var util = require('util');

module.exports = function () {
    return function (connection) {

        connection.notice = function (target) {
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

            leading = 'NOTICE ' + target + ' :';
            maxlen = 512 -
                    (1 + connection.me.getNick().length + 1 + connection.me.getUsername().length + 1 + connection.me.getHostname().length + 1) -
                    leading.length -
                    2;
            message.match(new RegExp('.{1,' + maxlen + '}', 'g')).forEach(function (str) {
                if (str[0] === ' ') { //leading whitespace
                    str = str.substring(1);
                }
                if (str[str.length - 1] === ' ') { //trailing whitespace
                    str = str.substring(0, str.length - 1);
                }
                connection.write(leading + str);
            });

            if (target[0] === '#') {
                connection.emit('sendnotice', {
                    'target': target,
                    'message': message
                });
            }
        };

        connection.on('data', function (message) {
            if (message.command === 'NOTICE') {
                connection.emit('notice', {
                    'from': message.prefixIsHostmask() ? connection.getUser(message.parseHostmaskFromPrefix().nickname) : message.prefix,
                    'to': message.params[0].toLowerCase(),
                    'message': message.params[1]
                });
            }
        });
    };
};
