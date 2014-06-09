'use strict';
/* Load Config */
var config = require('config-node')({
    dir: 'config',
    ext: 'json'
});

/* Set DEBUG env */
process.env.DEBUG = config.debug;

/* Load coffea */
var coffea = require('coffea');

/* load brain */
var brain = require('./lib/brain')(config.redis);

/* Load GLaDOS */
var GLaDOS = require('./lib/GLaDOS')(config, coffea, brain);