'use strict';
var redis = require('redis');
var debug = require('debug')('glados:brain');

module.exports = function (config) {
    var client, env;
    if (process.env.VCAP_SERVICES !== undefined) {
        env = JSON.parse(process.env.VCAP_SERVICES);
        client = redis.createClient(env['redis-2.2'][0].credentials.port, env['redis-2.2'][0].credentials.host, {
            "auth_pass": env['redis-2.2'][0].credentials.password
        });
    } else if (config) {
        client = redis.createClient(config.port, config.host, {
            "auth_pass": config.pass
        });
    } else {
        client = redis.createClient();
    }
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