var fs          = require('fs');
var path        = require('path');
var _           = require('underscore');
var domain      = require('domain');
var database    = require('./database');
var SCRIPTS     = {};
var DEBUG       = {};

var scriptExists, scriptLoader, unload, load, reload, debugFunc;

debugFunc = function (connection, scriptName) {
    if (!DEBUG[connection.getId() + '-' + scriptName]) {
        DEBUG[connection.getId() + '-' + scriptName] = require('debug')(connection.getId() + ':script:' + scriptName);
    }
    return DEBUG[connection.getId() + '-' + scriptName];
};

scriptExists = function (scriptName, callback) {
    fs.exists(path.resolve(__dirname + '/../scripts/' + scriptName + '.js'), function (existsFile) {
        if (existsFile) {
            return callback(1);
        }
        fs.exists(path.resolve(__dirname + '/../scripts/' + scriptName + '/index.js'), function (existFolder) {
            return callback(existFolder ? 2 : 0);
        });
    });
};

scriptLoader = function (scriptName, connection) {
    var debug = debugFunc(connection, scriptName);
    return {
        on: function (name, callback, optCallback) {
            if (name === 'command') {
                var cmds = _.isArray(callback) ? callback : [callback];
                _.each(cmds, function (name) {
                    debug('Command "%s" registered.', name);
                    SCRIPTS[connection.config.id][scriptName].commands[name] = optCallback;
                    connection.on('command:' + name, optCallback);
                });
            } else if (name === 'load') {
                SCRIPTS[connection.config.id][scriptName].load = callback;
            } else if (name === 'unload') {
                SCRIPTS[connection.config.id][scriptName].unload = callback;
            } else {
                SCRIPTS[connection.config.id][scriptName].events[name] = callback;
                connection.on(name, callback);
            }
        },
        debug: debug,
        connection: connection,
        database: database,
        loadScript: function (name, callback) {
            return load(connection, name, callback);
        },
        unloadScript: function (name, callback) {
            return unload(connection, name, callback);
        },
        reloadScript: function (name, callback) {
            return reload(connection, name, callback);
        },
        listScripts: function () {
            return Object.keys(SCRIPTS[connection.config.id]);
        }
    };
};

load = function (connection, scriptName, callback) {
    scriptName = scriptName.toLowerCase();

    var thisScriptLoader = scriptLoader(scriptName, connection);

    SCRIPTS[connection.config.id] = SCRIPTS[connection.config.id] || {};
    thisScriptLoader.debug('Loading script ...');
    scriptExists(scriptName, function (exist) {
        if (!exist) {
            thisScriptLoader.debug('Script doesn\'t exist!');
            if (callback) {
                return callback(new Error('Script "' + scriptName + '" doesn\'t exist!'));
            }
        }
        if (_.has(SCRIPTS[connection.config.id], scriptName)) {
            thisScriptLoader.debug('Script is already loaded!');
            if (callback) {
                return callback(new Error('Script "' + scriptName + '" is already loaded!'));
            }
        }
        var scriptFile = path.resolve(exist === 1 ? (__dirname + '/../scripts/' + scriptName + '.js') : (__dirname + '/../scripts/' + scriptName + '/index.js'));
        SCRIPTS[connection.config.id][scriptName] = {
            script:     null,
            commands:   {},
            events:     {},
            domain:     domain.create(),
            load:       null,
            unload:     null,
            isFolder:   exist === 2
        };
        SCRIPTS[connection.config.id][scriptName].domain.on('error', function (err) {
            if (err.message.substr(0, 18) === 'Cannot find script') {
                if (callback) {
                    callback(new Error('Couldn\'t find script "' + scriptName + '".'));
                }
            }
            thisScriptLoader.debug('Error in script: %s', err.message, err.stack);
            SCRIPTS[connection.config.id][scriptName].domain.dispose();
            delete SCRIPTS[connection.config.id][scriptName];
        });

        process.nextTick(function () {
            SCRIPTS[connection.config.id][scriptName].domain.run(function () {
                SCRIPTS[connection.config.id][scriptName].script = require(scriptFile)(thisScriptLoader);
                thisScriptLoader.debug('Script loaded!', scriptName);
                if (SCRIPTS[connection.config.id][scriptName].load) {
                    SCRIPTS[connection.config.id][scriptName].load();
                }
                if (!_.contains(connection.config.scripts, scriptName)) {
                    connection.config.scripts.push(scriptName);
                    connection.config.save();
                }
                if (callback) {
                    callback(null);
                }
            });
        });
    });
};
exports.load = load;

unload = function (connection, scriptName, callback) {
    scriptName = scriptName.toLowerCase();
    var debug = debugFunc(connection, scriptName), name, cachedScript;

    debug('unloading script ...');

    if (!_.has(SCRIPTS[connection.config.id], scriptName)) {
        debug('script isn\'t loaded.');
        if (callback) {
            callback(new Error('Script "' + scriptName + '" isn\'t loaded.'));
        }
        return;
    }

    name = SCRIPTS[connection.config.id][scriptName].isFolder ? require.resolve('./../scripts/' + scriptName + '/index.js') : require.resolve('./../scripts/' + scriptName + '.js');
    cachedScript = require.cache[name];
    if (cachedScript) {
        delete require.cache[name];

        _.each(SCRIPTS[connection.config.id][scriptName].commands, function (fn, name) {
            debug('Command "%s" removed.', name);
            delete SCRIPTS[connection.config.id][scriptName].commands[name];
            connection.removeListener('command:' + name, fn);
        });

        _.each(SCRIPTS[connection.config.id][scriptName].events, function (fn, name) {
            debug('Event "%s" removed.', name);
            if (SCRIPTS[scriptName]) {
                delete SCRIPTS[scriptName].events[name];
            }
            connection.removeListener(name, fn);
        });

        if (SCRIPTS[connection.config.id][scriptName].unload) {
            SCRIPTS[connection.config.id][scriptName].unload();
        }

        SCRIPTS[connection.config.id][scriptName].domain.dispose();

        delete SCRIPTS[connection.config.id][scriptName];

        debug('unloaded.');

        delete DEBUG[connection.getId() + '-' + scriptName];

        if (_.contains(connection.config.scripts, scriptName)) {
            connection.config.scripts = _.without(connection.config.scripts, scriptName);
            connection.config.save();
        }
        if (callback) {
            callback(null);
        }
        return;
    }
    debug('Couldn\'t unload script.');
    if (callback) {
        callback(new Error('Couldn\'t unload script "' + scriptName + '".'));
    }
};

reload = function (connection, scriptName, callback) {
    unload(connection, scriptName, function (err) {
        if (err) {
            if (callback) {
                callback(err);
            }
        } else {
            load(connection, scriptName, callback);
        }
    });
};