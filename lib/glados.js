var debug   = require('debug')('GLaDOS');
var nconf   = require('nconf');
var path    = require('path');


nconf
    .argv()
    .env()
    .file(path.join(__dirname, '..', 'config.json'))
    .defaults({
    'if nothing else': 'use this value'
});