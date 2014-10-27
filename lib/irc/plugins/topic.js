module.exports = function () {
    return function (connection) {

        connection.topic = function (channel, topic) {
            channel = typeof channel !== 'string' ? channel.getName() : channel;
            topic = topic || '';
            connection.write('TOPIC ' + channel + ' :' + topic);
        };

        connection.on('data', function (message) {
            var channel;
            if (message.command === 'RPL_TOPIC') {
                connection.getChannel(message.params[1]).topic.topic = message.params[2];
            } else if (message.command === 'RPL_TOPIC_WHO_TIME') {
                channel = connection.getChannel(message.params[1]);
                channel.topic.user = connection.getUser(message.params[2].split('!')[0]);
                channel.topic.time = new Date(parseInt(message.params[3], 10) * 1000);
                connection.emit('topic', {
                    'channel': channel,
                    'topic': channel.topic.topic,
                    'user': channel.topic.user,
                    'time': channel.topic.time,
                    'changed': false
                });
                connection.conManager.emit('topic', connection, {
                    'channel': channel,
                    'topic': channel.topic.topic,
                    'user': channel.topic.user,
                    'time': channel.topic.time,
                    'changed': false
                });
            } else if (message.command === 'TOPIC') {
                channel = connection.getChannel(message.params[0]);
                channel.topic.topic = message.params[1];
                channel.topic.user = message.prefixIsHostmask() ? connection.getUser(message.parseHostmaskFromPrefix().nickname) : message.prefix;
                channel.topic.time = new Date();
                connection.emit('topic', {
                    'channel': channel,
                    'topic': channel.topic.topic,
                    'user': channel.topic.user,
                    'time': channel.topic.time,
                    'changed': true
                });
                connection.conManager.emit('topic', connection, {
                    'channel': channel,
                    'topic': channel.topic.topic,
                    'user': channel.topic.user,
                    'time': channel.topic.time,
                    'changed': true
                });
            }
        });
    };
};
