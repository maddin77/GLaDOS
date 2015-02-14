/*jslint stupid: true*/
"use strict";
var fs      = require('fs'),
    async   = require('async');

process.env.DEBUG = "*";

async.map(fs.readdirSync('./data/connections'), function (fileName, callback) {
    fs.readFile('./data/connections/' + fileName, {encoding: "utf8"}, function (err, data) {
        if (err) {
            callback(err, {});
        } else {
            var cfg = JSON.parse(data);
            cfg.irc.id          = fileName.slice(0, -5);
            cfg.irc.debug       = cfg.debug     || false;
            cfg.irc.userAgent   = cfg.userAgent || "GLaDOS IRC-Bot - https://github.com/maddin77/GLaDOS";
            cfg.irc.admin       = cfg.admin     || [];
            cfg.irc.callsign    = cfg.callsign  || "!";
            cfg.irc.scripts     = cfg.scripts   || [];
            cfg.irc.autoConnect = false;
            callback(null, cfg.irc);
        }
    });
}, function (err, results) {
    if (err) {
        throw err;
    }
    //console.log(results);
    var GLaDOS = new (require('./lib/GLaDOS'))(results);
});

/* Load Config */
//var config = require('./lib/database')();

/* Set DEBUG env */
//process.env.DEBUG = config.debug ? "*" : "";

/* Load GLaDOS */
//var GLaDOS = new (require('./lib/GLaDOS'))(config);