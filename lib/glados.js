var debug   = require('debug')('GLaDOS');
var path    = require('path');
var async   = require('async');
var _       = require('underscore');
var fs      = require('fs');
var Factory = require('irc-factory');
var api     = new Factory.Api();
var plugins = require(path.join(__dirname, 'plugins'));
plugins.setApi(api);

async.waterfall([
    function (callback) {
        //debug('reading plugins directory...');
        //return fs.readdir(path.join(__dirname, '..', 'plugins'), callback);
        return callback(null, [
            path.join(__dirname, '..', 'web', 'index.js'),
            path.join(__dirname, '..', 'plugins', 'cleverbot.js'),
            path.join(__dirname, '..', 'plugins', 'ping.js'),
            //path.join(__dirname, '..', 'plugins', 'quiz.js'),
            //path.join(__dirname, '..', 'plugins', 'chancontrol.js'),
            path.join(__dirname, '..', 'plugins', 'control.js'),
        ]);
    },
    function (pluginNames, callback) {
        debug('loading plugins...');
        return async.eachSeries(pluginNames, function (pluginPath, fn) {
            return plugins.loadPlugin(pluginPath, fn);
        }, callback);
    },
    function (callback) {
        debug('reading config directory...');
        return fs.readdir(path.join(__dirname, '..', 'config'), function (error, configNames) {
            return callback(error, _.filter(configNames, function (fileName) {
                return fileName.slice(-9) === '.irc.json';
            }));
        });
    },
    function (configNames, callback) {
        debug('connecting to server(s)...');
        configNames.forEach(function (configName) {
            var svr = require(path.join(__dirname, 'server.js'))(api, configName.slice(0, -9));
            plugins.addServer(svr);
        });
        return callback(null);
    },
], function (err) {
    if (err) {
        throw err;
    }
});

/*async.each(openFiles, saveFile, function(err){
    // if any of the saves produced an error, err would equal that error
});

fs.readdirSync(path.join(__dirname, '..', 'config')).forEach(function (file) {
    var filePath = path.join(__dirname, 'config', file);
    if (path.basename(filePath) === '.gitkeep') {
        return;
    }
    var name = path.basename(filePath, '.json');
    debug('loading server "' + name + '"...', file);
    var svr = require(path.join(__dirname, 'server'))(api, name);
    plugins.addServer(name, svr);
});*/