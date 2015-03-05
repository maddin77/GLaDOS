var debug   = require('debug')('Plugins');
var domain  = require('domain');
var _       = require('lodash');
var path    = require('path');

var _CONNECTION = null;
var _CONFIG     = null;
var _PLUGINS    = [];

var _REGISTERED_VARS = {};

var getInterface = function (name) {
    var idebug = require('debug')('plg:' + name);
    idebug('creating interface...');
    var Interface = {};

    Interface._name = name;
    Interface._config = _CONFIG;

    //glados.debug
    Interface.debug = idebug;

    Interface.isDisabled = function (channel) {
        var channelConfig = _CONFIG('channels').find({ name: channel });
        return (_.has(channelConfig, 'disabled') && channelConfig.disabled.indexOf(Interface._name) > -1);
    };

    Interface.brain = require(path.join(__dirname, 'brain'));

    //glados.on
    Interface.on = function (event, callback) {
        _CONNECTION.on(event, function (event) {
            callback.call(_CONNECTION, event);
        });
        idebug('event "%s" registered', event);
    };

    //glados.hear
    Interface.hear = function (expression, callback) {
        _CONNECTION.on('message', function (event) {
            //Plugin ist für Channel X deaktiviert
            if (Interface.isDisabled(event.channel.getName())) {
                return;
            }

            var match = null;
            if ((match = event.message.match(expression)) !== null) {
                callback.call(_CONNECTION, match, event);
            }
        });
        idebug('hear "%s" registered', expression.toString());
    };

    Interface.connection = _CONNECTION;
    Interface.config = _CONFIG;

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

var setConnection = function (connection) {
    _CONNECTION = connection;
};
exports.setConnection = setConnection;

var setConfig = function (config) {
    _CONFIG = config;
};
exports.setConfig = setConfig;

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
        debug('loading plugin %s@%s...', plugin.info.name, plugin.info.version, pluginPath);
        plugin.register(getInterface(plugin.info.name), function () {
            _PLUGINS.push(plugin);
            debug('plugin %s@%s loaded', plugin.info.name, plugin.info.version);
            if (callback) {
                return callback(null);
            }
        });
    });
};
exports.loadPlugin = loadPlugin;

var getPlugins = function () {
    return _.map(_PLUGINS, function (pl) {
        return pl.info;
    });
};
exports.getPlugins = getPlugins;