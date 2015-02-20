var low     = require('lowdb');
var path    = require('path');
var _       = require('underscore');

module.exports = function (api, name) {
    var debug   = require('debug')('svr:' + name);
    debug('connecting...');

    var config  = low(path.join(__dirname, '..', 'config', name + '.irc.json'), {
        autosave: true,
        async: true
    });

    var client = api.createClient(name, config.object.connection);
    api.hookEvent(name, '*', function (message) {
        if (message && message.raw) {
            if (_.isArray(message.raw)) {
                _.each(message.raw, function (raw) {
                    debug(raw);
                });
            } else {
                debug(message.raw);
            }
        } else if (this.event[1] === 'closed' || this.event[1] === 'failed') {
            debug(message);
        }
    });
    api.hookEvent(name, 'registered', function () {
        config('channels').each(function (channel) {
            if (!_.isUndefined(channel.autojoin) && !channel.autojoin) {
                return;
            }
            client.irc.join(channel.name);
        });
    });

    return {
        name: name,
        client: client,
        config: config
    };
};