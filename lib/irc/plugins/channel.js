var _ = require('underscore');
var Channel = require('../channel.js');

module.exports = function () {
    var channelCache = [],
        channelList = [];
    return function (connection) {

        connection.getChannellist = function () {
            return channelList;
        };

        connection.getChannel = function (name) {
            var channel = _.find(channelCache, function (chan) {
                return chan.getName() === name;
            });
            if (channel === undefined) {
                channel = new Channel(name, connection);
                channelCache.push(channel);
            }
            return channel;
        };

        connection.isChannel = function (channel) {
            return channel instanceof Channel;
        };

        connection.on('join', function (event) {
            //add channel to list if we joined
            if (event.user.getNick() === connection.me.getNick()) {
                channelList.push(event.channel.getName());
                channelList = _.uniq(channelList);
            }
        });

        connection.on('part', function (event) {
            //remove channel from list if we parted
            if (event.user.getNick() === connection.me.getNick()) {
                event.channels.forEach(function (channel) {
                    channelList = _.without(channelList, channel.getName());
                });
            }
        });

        connection.on('kick', function (event) {
            //remove channel from list if we got kicked
            if (event.user.getNick() === connection.me.getNick()) {
                channelList = _.without(channelList, event.channel.getName());
            }
        });

        connection.on('motd', function () {
            //autojoin channel
            if (connection.config.channels.length > 0) {
                connection.config.channels.forEach(function (channel) {
                    connection.join(channel);
                });
            }
        });
    };
};
