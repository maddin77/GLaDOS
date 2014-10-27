var _ = require('underscore');
var User = require('../user.js');

module.exports = function () {
    var userCache = [];
    return function (connection) {

        connection.getUser = function (nick) {
            if (!nick) {
                return connection.me;
            }
            var user = _.find(userCache, function (usr) {
                return usr.getNick() === nick;
            });
            if (user === undefined) {
                user = new User(nick, connection);
                userCache.push(user);
            }
            return user;
        };

        connection.isUser = function (user) {
            return user instanceof User;
        };

        var removeUser = function (user) {
            user = connection.isUser(user) ? user.getNick() : user;
            userCache = _.filter(userCache, function (u) {
                return u.getNick() !== user;
            });
        };

        connection.on('join', function (event) {
            //add user to channellist
            event.channel.names[event.user.getNick()] = [];
        });

        connection.on('part', function (event) {
            //remove user from channellist
            event.channels.forEach(function (channel) {
                delete channel.names[event.user.getNick()];
            });

            //check if we know the user from another channel. if not, remove him from usercache.
            var found = false;
            connection.getChannellist().forEach(function (channelName) {
                _.each(connection.getChannel(channelName).getNames(), function (mode, nick) {
                    if (event.user.getNick() === nick) {
                        found = true;
                    }
                });
            });
            if (!found) {
                removeUser(event.user);
            }
        });

        connection.on('kick', function (event) {
            //remove user from channellist
            delete event.channel.names[event.user.getNick()];

            //check if we know the user from another channel. if not, remove him from usercache.
            var found = false;
            connection.getChannellist().forEach(function (channelName) {
                _.each(connection.getChannel(channelName).getNames(), function (mode, nick) {
                    if (event.user.getNick() === nick) {
                        found = true;
                    }
                });
            });
            if (!found) {
                removeUser(event.user);
            }
        });

        connection.on('quit', function (event) {
            //remove user from usercache
            removeUser(event.user);
        });

        /*connection.on('data', function (message) {
            if (message.command === '396') {
                connection.me.hostname = msg.params.split(' ')[1];
            } else if (msg.command === 'RPL_WHOREPLY') {
                var params = msg.params.split(' '),
                    user = connection.getUser(params[5]);
                user.username = params[2];
                user.hostname = params[3];
                user.server = params[4];
                user.realname = msg.trailing.split(' ')[1];
            }
        });*/
    };
};
