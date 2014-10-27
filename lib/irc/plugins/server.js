module.exports = function () {
    return function (connection) {
        connection.on('data', function (message) {
            //console.log(msg);
            var match, supports;
            switch (message.command) {
            case 'RPL_YOURHOST':
                match = message.params[1].match(/^Your host is (\S+), running version (\S+)$/i);
                connection.connectionInfo.servername = match[1];
                connection.connectionInfo.version = match[2];
                break;
            case 'RPL_CREATED':
                connection.connectionInfo.created = new Date(message.params[1]);
                break;
            /*case 'RPL_MYINFO':
                //http://i.imgur.com/fWVvVno.gif
                break;*/
            case 'RPL_ISUPPORT':
                connection.connectionInfo.supports = connection.connectionInfo.supports || {};
                supports = message.params;
                supports.shift();
                supports.forEach(function (s) {
                    if (s.indexOf('=') !== -1) {
                        connection.connectionInfo.supports[s.split('=')[0]] = s.split('=')[1];
                    } else {
                        connection.connectionInfo.supports[s] = true;
                    }
                });
                break;
            }
        });
    };
};