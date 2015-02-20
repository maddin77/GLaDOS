var debug   = require('debug')('Plugins');
var path    = require('path');
var domain  = require('domain');
var _       = require('underscore');

var _API        = null;
var _PLUGINS    = [];
var _SERVERS    = [];

var _PLUGIN_INTERFACE = {};

var getServer = function (key) {
    return _.findWhere(_SERVERS, {name: key});
};

var _REGISTERED_VARS = {};

var getInterface = function (name) {
    var idebug = require('debug')('plg:' + name);
    idebug('creating interface...');
    var Interface = {};

    //glados.debug
    Interface.debug = idebug;

    //glados.on
    Interface.on = function (event, callback) {
        _API.hookEvent('*', event, function (event) {
            var client = getServer(this.event[0]).client;
            callback.call(this, event, client);
        });
        idebug('event "%s" registered', event);
    };

    //glados.hear
    Interface.hear = function (expression, callback) {
        _API.hookEvent('*', 'privmsg', function (event) {
            var self = this;
            var server = getServer(self.event[0]);

            //Plugin ist deaktiviert für channel X auf server Y
            var channelConfig = server.config('channels').find({ name: event.target });
            if (_.has(channelConfig, 'disabled') && channelConfig.disabled.indexOf(name) > -1) {
                return;
            }

            var client = server.client;
            var match = null;
            if ((match = event.message.match(expression)) !== null) {
                callback.call(self, match, event, client);
            }

        });
        idebug('hear "%s" registered', expression.toString());
    };

    //glados.isAdmin
    Interface.isAdmin = function (name, client) {
        var server = getServer(client.key);
        return server.config('admin').value().indexOf(name) > -1;
    };

    //glados.register
    Interface.register = function (key, value) {
        _REGISTERED_VARS[key] = value;
        Interface[key] = value;
    };

    _.each(_REGISTERED_VARS, function (value, key) {
        Interface[key] = value;
    });

    return Interface;
};

var setApi = function (api) {
    _PLUGIN_INTERFACE.on = api;
    _API = api;
};
exports.setApi = setApi;

var loadPlugin = function (pluginPath, _callback) {
    var callback = _.once(_callback);
    var dom = domain.create();
    dom.on('error', function (err) {
        debug('error in script: %s', err.message, err.stack);
        dom.dispose();
        if (callback) {
            return callback(err);
        }
    });
    dom.run(function () {
        var plugin = require(pluginPath);
        debug('loading plugin %s@%s...', plugin.attributes.name, plugin.attributes.version, pluginPath);
        plugin.register(getInterface(plugin.attributes.name), function () {
            _PLUGINS.push(plugin);
            debug('plugin %s@%s loaded', plugin.attributes.name, plugin.attributes.version);
            if (callback) {
                return callback(null);
            }
        });
    });
};
exports.loadPlugin = loadPlugin;

var addServer = function (svr) {
    debug('registering server ' + svr.name);
    _SERVERS.push(svr);
};
exports.addServer = addServer;