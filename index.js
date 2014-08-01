'use strict';
/* Load Config */
var config = require('./lib/database')();

/* Set DEBUG env */
process.env.DEBUG = config.debug;

/* Load coffea */
var coffea = require('coffea');

/* Load GLaDOS */
var GLaDOS = require('./lib/GLaDOS')(config, coffea);