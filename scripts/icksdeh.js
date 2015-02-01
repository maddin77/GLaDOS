var _ = require('underscore');

module.exports = function (scriptLoader) {
    var xDDB = scriptLoader.database('icksdeh');
    var conID = scriptLoader.connection.getId();
    xDDB[conID] = xDDB[conID] || {};
    xDDB.save();

    var seegrass = function (nick) {
        return nick.indexOf('s', nick.length - 1) !== -1 ? nick : (nick + 's');
    };

    scriptLoader.on('command', 'icksdeh', function (event) {
        var target = event.params.length > 0 ? event.params[0] : 'Christian';
        var xD = xDDB[conID][target] || 0;
        event.channel.say('%s Anti Benis: %s € (%sx)', seegrass(target), (xD * 0.10), xD);
    });
    scriptLoader.on('message', function (event) {
        var match = event.message.match(/\bx(d+)\b/gi);
        if (match !== null) {
            var nick = event.user.getNick();
            if (!_.has(xDDB[conID], nick)) {
                xDDB[conID][nick] = 0;
            }
            _.each(match, function (m) {
                xDDB[conID][nick] += (m.length - 1);
            });
            xDDB.save();
        }
    });
};
