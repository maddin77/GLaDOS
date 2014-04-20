'use strict';
/* Load Config */
var config = require('config-node')();

/* Set DEBUG env */
process.env.DEBUG = config.debug;

/* Load coffea */
var coffea = require('coffea');

/* load brain */
var brain = require('./lib/brain')(config.redis);

/* Load GLaDOS */
var GLaDOS = require('./lib/GLaDOS')(config, coffea, brain);

/* Load Scripts */
GLaDOS.require(__dirname + '/scripts/chancontrol');
GLaDOS.require(__dirname + '/scripts/cleverbot');
GLaDOS.require(__dirname + '/scripts/control');
GLaDOS.require(__dirname + '/scripts/cryptocoin');
GLaDOS.require(__dirname + '/scripts/dice');
GLaDOS.require(__dirname + '/scripts/google');
GLaDOS.require(__dirname + '/scripts/hash');
GLaDOS.require(__dirname + '/scripts/lastfm');
GLaDOS.require(__dirname + '/scripts/morse');
GLaDOS.require(__dirname + '/scripts/net');
GLaDOS.require(__dirname + '/scripts/ping');
GLaDOS.require(__dirname + '/scripts/quiz');
GLaDOS.require(__dirname + '/scripts/sandbox');
GLaDOS.require(__dirname + '/scripts/stats');
GLaDOS.require(__dirname + '/scripts/translate');
GLaDOS.require(__dirname + '/scripts/urbandictionary');
GLaDOS.require(__dirname + '/scripts/urltitle');
GLaDOS.require(__dirname + '/scripts/weather');
GLaDOS.require(__dirname + '/scripts/wikipedia');
GLaDOS.require(__dirname + '/scripts/wolframalpha');