'use strict';
var config = module.exports.config = require('config-node')();
process.env.DEBUG = config.debug;
var Client = require(__dirname + '/irc/client');
var debug = require('debug')('glados');
var irc = new Client(config);
irc.brain = require(__dirname + '/brain')(config.redis);

irc.exit = function (str) {
    debug('Shutting down "%s"', str);
    irc.quit(str, function () {
        debug('Disconnected from IRC');
        irc.brain.quit(function (err, res) {
            debug('Disconnected from redis.');
            debug('Error: %s', err);
            debug('res: %s', res);
        });
    });
};

module.exports.use = function (fn) {
    fn(irc);
};