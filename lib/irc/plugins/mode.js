var _ = require('lodash');

module.exports = function () {
    return function (connection) {

        connection.mode = function (target, flags, params) {
            if (typeof target !== 'string') {
                if (connection.isUser(target)) {
                    target = target.getNick();
                } else if (connection.isChannel(target)) {
                    target = target.getName();
                } else {
                    target = target.toString();
                }
            }
            if (params) {
                connection.write('MODE ' + target + ' ' + flags + ' ' + params);
            } else {
                connection.write('MODE ' + target + ' ' + flags);
            }
        };

        connection.on('data', function (message) {
            if (message.command === 'MODE') {
                var modeList, modeArgs, adding, by, channel, argument;

                modeList = message.params[1].split('');

                modeArgs = _.rest(_.rest(message.params));

                adding = true;

                if (message.prefixIsHostmask()) {
                    by = connection.getUser(message.parseHostmaskFromPrefix().nickname);
                } else {
                    by = message.prefix;
                }

                channel = (message.params[0][0] === '#' || message.params[0][0] === '&') ? connection.getChannel(message.params[0]) : null;

                modeList.forEach(function (mode) {
                    if (mode === '+') {
                        adding = true;
                        return;
                    }
                    if (mode === '-') {
                        adding = false;
                        return;
                    }
                    if (_.indexOf(['Y', 'q', 'a', 'o', 'h', 'v'], mode) !== -1) {
                        argument = modeArgs.shift() || null;
                        if (channel) {
                            if (adding) {
                                switch (mode) {
                                case 'Y':
                                    channel.names[argument] = '!';
                                    break;
                                case 'q':
                                    channel.names[argument] = '~';
                                    break;
                                case 'a':
                                    channel.names[argument] = '&';
                                    break;
                                case 'o':
                                    channel.names[argument] = '@';
                                    break;
                                case 'h':
                                    channel.names[argument] = '%';
                                    break;
                                case 'v':
                                    channel.names[argument] = '+';
                                    break;
                                }
                            } else {
                                channel.names[argument] = '';
                            }
                        }
                        connection.emit('mode', {
                            'channel': channel,
                            'by': by,
                            'argument': argument,
                            'adding': adding,
                            'mode': mode
                        });
                    } else {
                        var modeArg = null;
                        if (mode.match(/^[bkl]$/)) {
                            modeArg = modeArgs.shift();
                            if (modeArg.length === 0) {
                                modeArg = undefined;
                            }
                        }
                        connection.emit('mode', {
                            'channel': channel,
                            'by': by,
                            'argument': modeArg,
                            'adding': adding,
                            'mode': mode
                        });
                    }
                });
            }
        });
    };
};
