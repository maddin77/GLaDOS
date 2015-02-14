'use strict';
var redis = require('redis');
var HOST = '', PORT = 80, OPTIONS = {};
if (process.env.VCAP_SERVICES !== undefined) {
    var env = JSON.parse(process.env.VCAP_SERVICES);
    HOST = env['redis-2.2'][0].credentials.host;
    PORT = env['redis-2.2'][0].credentials.port;
    OPTIONS = {
        auth_pass: env['redis-2.2'][0].credentials.password
    };
} else {
    HOST = '127.0.0.1';
    PORT = 6379;
}
module.exports = function (logger) {
    var client = redis.createClient(PORT, HOST, OPTIONS);
    client.on('error', function (error) {
        logger.error('[REDIS] %s', error, error);
    });
    return client;
};