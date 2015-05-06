var debug   = require('debug')('GLaDOS');
var path    = require('path');
var async   = require('async');
var _       = require('lodash');
var low     = require('lowdb');

async.waterfall([
    function (callback) {
        debug('reading config...');
        var config  = low(path.join(__dirname, '..', 'config.json'), {
            autosave: true,
            async: true
        });
        callback(null, config);
    },
    function (config, callback) {
        debug('preparing connection...');
        var Connection = require(path.join(__dirname, 'irc', 'connection'));
        var connection = new Connection(config);
        callback(null, config, connection);
    },
    function (config, connection, callback) {
        debug('preparing plugin interface...');
        var plugins = require(path.join(__dirname, 'plugins'));
        plugins.setConfig(config);
        plugins.setConnection(connection);
        callback(null, config, connection, plugins);
    },
    function (config, connection, plugins, callback) {
        debug('settings up webserver...');
        var webserver = require(path.join(__dirname, 'webserver'));
        webserver.start(config, plugins.registerPluginFunction, function () {
            plugins.setupWebserver(webserver.getServer());
            callback(null, config, connection, plugins);
        });
    },
    function (config, connection, plugins, callback) {
        debug('loading plugins...');
        return async.eachSeries([
                //path.join(__dirname, '..', 'plugins', 'quiz'),
            path.join(__dirname, '..', 'plugins', 'chancontrol.js'),
            path.join(__dirname, '..', 'plugins', 'cleverbot'),
            path.join(__dirname, '..', 'plugins', 'control'),
            path.join(__dirname, '..', 'plugins', 'cryptocoin'),
            path.join(__dirname, '..', 'plugins', 'dice'),
                //path.join(__dirname, '..', 'plugins', 'domaininfo'),
                //path.join(__dirname, '..', 'plugins', 'ipinfo'),
            path.join(__dirname, '..', 'plugins', 'dns'),
            path.join(__dirname, '..', 'plugins', 'flip'),
            path.join(__dirname, '..', 'plugins', 'geoip'),
            path.join(__dirname, '..', 'plugins', 'google'),
            path.join(__dirname, '..', 'plugins', 'hash'),
            path.join(__dirname, '..', 'plugins', 'help'),
            path.join(__dirname, '..', 'plugins', 'icksdeh'),
            path.join(__dirname, '..', 'plugins', 'isup'),
            path.join(__dirname, '..', 'plugins', 'lastfm'),
            path.join(__dirname, '..', 'plugins', 'logs'),
            path.join(__dirname, '..', 'plugins', 'morse'),
            path.join(__dirname, '..', 'plugins', 'ping'),
            path.join(__dirname, '..', 'plugins', 'quotes'),
            path.join(__dirname, '..', 'plugins', 'rss'),
            path.join(__dirname, '..', 'plugins', 'sandbox'),
                //path.join(__dirname, '..', 'plugins', 'stats'),
            path.join(__dirname, '..', 'plugins', 'steam'),
            path.join(__dirname, '..', 'plugins', 'translate'),
                //path.join(__dirname, '..', 'plugins', 'update'),
            path.join(__dirname, '..', 'plugins', 'urbandictionary'),
            path.join(__dirname, '..', 'plugins', 'urltitle'),
            path.join(__dirname, '..', 'plugins', 'weather'),
            path.join(__dirname, '..', 'plugins', 'wikipedia'),
            path.join(__dirname, '..', 'plugins', 'wolframalpha'),
        ], function (pluginPath, fn) {
            return plugins.loadPlugin(pluginPath, fn);
        }, function (error) {
            callback(error, config, connection, plugins);
        });
    },
    function (config, connection, plugins, callback) {
        debug('connecting to irc server...');

        connection.connect(function () {
            //connection.write('MODE ' + connection.config.nick + ' +B');

            connection.on('motd', function () {
                //autojoin channel
                config('channels').each(function (channel) {
                    if (!_.isUndefined(channel.autojoin) && !channel.autojoin) {
                        return;
                    }
                    connection.join(channel.name);
                });
            });
        });

        return callback(null);
    },
], function (err) {
    if (err) {
        throw err;
    }
});
