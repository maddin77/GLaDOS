"use strict";

var debug = require('debug')('GLaDOS:scriptLoader');
var _ = require('underscore');
var fs = require('fs');
var path = require('path');
var domain = require('domain');

module.exports = function (client) {
    var SCRIPTS, _scriptLoader, loadScript, unloadScript, reloadScript;

    SCRIPTS = {};

    _scriptLoader = function (scriptName) {
        return {
            registerCommand: function (names, fn) {
                names = _.isArray(names) ? names : [names];
                _.each(names, function (name) {
                    debug('[%s] Command "%s" registered.', scriptName, name);
                    SCRIPTS[scriptName].commands[name] = fn;
                    client.commands.on(name, fn);
                });
                return this;
            },
            registerEvent: function (name, fn) {
                debug('[%s] Event "%s" registered.', scriptName, name);
                SCRIPTS[scriptName].events[name] = fn;
                client.on(name, fn);
            },
            unload: function (fn) {
                SCRIPTS[scriptName].unload = fn;
            },
            loadScript: loadScript,
            unloadScript: unloadScript,
            reloadScript: reloadScript
        };
    };

    loadScript = function (scriptName, fn) {
        scriptName = scriptName.toLowerCase();
        var scriptFile = path.resolve(__dirname + '/../scripts/' + scriptName + '.js');
        debug('[%s] Loading...', scriptName);

        fs.exists(scriptFile, function (exists) {
            if (!exists) {
                debug('[%s] Script "%s" doesn\'t exist.', scriptName, scriptFile);
                if (fn) {
                    fn(new Error('Script "' + scriptFile + '" doesn\'t exist.'));
                }
            } else {
                if (_.has(SCRIPTS, scriptName)) {
                    debug('[%s] is already loaded.', scriptName);
                    if (fn) {
                        fn(new Error('Script "' + scriptName + '" is already loaded.'));
                    }
                } else {
                    SCRIPTS[scriptName] = {
                        script: null,
                        commands: {},
                        events: {},
                        domain: domain.create(),
                        unload: null
                    };
                    SCRIPTS[scriptName].domain.on('error', function (err) {
                        if (err.message.substr(0, 18) === 'Cannot find module') {
                            if (fn) {
                                fn(new Error('Couldn\'t find Script "' + scriptName + '".'));
                            }
                        }
                        debug('[%s] Error: %s', scriptName, err.message, err.stack);
                        SCRIPTS[scriptName].domain.dispose();
                        delete SCRIPTS[scriptName];
                    });
                    process.nextTick(function () {
                        SCRIPTS[scriptName].domain.run(function () {
                            SCRIPTS[scriptName].script = require(require.resolve('./../scripts/' + scriptName + '.js'))(_scriptLoader(scriptName), client);
                            debug('[%s] loaded.', scriptName);
                            if (!_.contains(client.config.scripts, scriptName)) {
                                client.config.scripts.push(scriptName);
                                client.saveConfig();
                            }
                            if (fn) {
                                fn(null);
                            }
                            client.brain.sadd('scripts', scriptName);
                        });
                    });
                }
            }
        });
    };

    unloadScript = function (scriptName, fn) {
        scriptName = scriptName.toLowerCase();
        debug('[%s] Unloading...', scriptName);

        if (!_.has(SCRIPTS, scriptName)) {
            debug('[%s] isn\'t loaded.', scriptName);
            if (fn) {
                fn(new Error('Script "' + scriptName + '" isn\'t loaded.'));
            }
            return;
        }

        var name = require.resolve('./../scripts/' + scriptName + '.js'),
            cachedScript = require.cache[name];
        if (cachedScript) {
            delete require.cache[name];

            _.each(SCRIPTS[scriptName].commands, function (value, key) {
                debug('[%s] Command "%s" removed.', scriptName, key);
                delete SCRIPTS[scriptName].commands[key];
                client.commands.removeListener(key, value);
            });

            _.each(SCRIPTS[scriptName].events, function (value, key) {
                debug('[%s] Event "%s" removed.', scriptName, key);
                delete SCRIPTS[scriptName].events[key];
                client.removeListener(key, value);
            });

            if (SCRIPTS[scriptName].unload) {
                SCRIPTS[scriptName].unload();
            }

            SCRIPTS[scriptName].domain.dispose();

            delete SCRIPTS[scriptName];

            debug('[%s] unloaded.', scriptName);
            if (_.contains(client.config.scripts, scriptName)) {
                client.config.scripts = _.without(client.config.scripts, scriptName);
                client.saveConfig();
            }
            if (fn) {
                fn(null);
            }
            client.brain.srem('scripts', scriptName);
            return;
        }
        debug('[%s] Couldn\'t unload script.', scriptName);
        if (fn) {
            fn(new Error('Couldn\'t unload script "' + scriptName + '".'));
        }
    };

    reloadScript = function (scriptName, fn) {
        unloadScript(scriptName, function (err) {
            if (err) {
                fn(err);
            } else {
                loadScript(scriptName, fn);
            }
        });
    };

    return {
        load: loadScript,
        unload: unloadScript,
        reload: reloadScript
    };
};