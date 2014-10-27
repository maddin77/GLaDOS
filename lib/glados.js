var debug               = require('debug')('GLaDOS');
var fs                  = require('fs');
var path                = require('path');
var async               = require('async');
var scriptManager       = require('./scriptManager');
var ConnectionManager   = require('./irc/connectionManager');
var conManager          = new ConnectionManager();
var database            = require('./database');

var getConfigurationFiles = function (callback) {
    fs.readdir('./config', function (err, files) {
        if (err) {
            throw err;
        }
        async.filter(files, function (fileName, callback) {
            return callback(fileName[0] !== '_' && fileName.slice(-5) === '.json');
        }, callback);
    });
};

var getConfigObjects = function (callback) {
    getConfigurationFiles(function (files) {
        async.map(files, function (fileName, callback) {
            var cfg = database(path.join(__dirname, '..', 'config'), fileName);
            //fs.readFile('./config/' + fileName, {encoding: "utf8"}, function (err, content) {
            //    var cfg = JSON.parse(content);
            cfg.id          = fileName.slice(0, -5);
            cfg.userAgent   = cfg.userAgent || 'GLaDOS IRC-Bot - https://github.com/maddin77/GLaDOS';
            cfg.admin       = cfg.admin     || [];
            cfg.callsign    = cfg.callsign  || '!';
            cfg.scripts     = cfg.scripts   || [];
            if (cfg.autoConnect) {
                delete cfg.autoConnect;
            }
            callback(null, cfg);
            //});
        }, callback);
    });
};

var connectToIrc = function (config) {
    var connection = conManager.createConnection(config);

    connection.debug = require('debug')(connection.config.id);

    connection.on('data', function (data) {
        connection.debug('>> ' + data.toString());
    });
    connection.on('write', function (str) {
        connection.debug('<< ' + str);
    });

    async.eachSeries(connection.config.scripts, function (scriptName, callback) {
        scriptManager.load(connection, scriptName, callback);
    });

    connection.connect(function () {
        connection.write('MODE ' + connection.config.nick + ' +B');
    });
};

var fireUp = function () {
    debug('Firering up \\o/');

    getConfigObjects(function (err, configFiles) {
        if (err) {
            throw err;
        }
        async.each(configFiles, connectToIrc);
    });
};
exports.fireUp = fireUp;