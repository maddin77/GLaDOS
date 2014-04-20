'use strict';
var redis = require('redis');
var debug = require('debug')('GLaDOS:brain');

module.exports = function (config) {
    var client = redis.createClient(config.port, config.host, {
        "auth_pass": config.pass
    });
    client.on('ready', function () {
        debug('A connection is established to the Redis server');
    });
    client.on('error', function (error) {
        debug(error);
    });
    client.on('end', function () {
        debug('An established Redis server connection has closed.');
    });
    client.on('idle', function (error) {
        debug('There are no outstanding commands that are awaiting a response');
    });
    return client;
};