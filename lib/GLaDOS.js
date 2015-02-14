'use strict';
var debug = require('debug');//('GLaDOS');
var tls = require('tls');
var net = require('net');
var EventEmitter = require('events').EventEmitter;
var _ = require('underscore');
var fs = require('fs');
var path = require('path');
var async = require('async');
var ConnectionManager = require('girc');

var GLaDOS = module.exports = function (config) {
    var self = this;

    this.commands = new EventEmitter();

    this.config = config;

    this.connectionManager = new ConnectionManager(config);

    this.colorize = function (msg) {
        var codes = {
            bold:           '\u0002',
            reset:          '\u000f',
            underline:      '\u001f',
            reverse:        '\u0016',

            white:          '\u000300',
            black:          '\u000301',
            dark_blue:      '\u000302',
            dark_green:     '\u000303',
            light_red:      '\u000304',
            dark_red:       '\u000305',
            magenta:        '\u000306',
            orange:         '\u000307',
            yellow:         '\u000308',
            light_green:    '\u000309',
            cyan:           '\u000310',
            light_cyan:     '\u000311',
            light_blue:     '\u000312',
            light_magenta:  '\u000313',
            gray:           '\u000314',
            light_gray:     '\u000315'
        };

        msg = msg.replace(/\{B\}/g, codes.bold);
        msg = msg.replace(/\{R\}/g, codes.reset);
        msg = msg.replace(/\{U\}/g, codes.underline);
        msg = msg.replace(/\{REV\}/g, codes.reverse);
        msg = msg.replace(/\{FF\}/g, codes.whies);
        msg = msg.replace(/\{00\}/g, codes.black);
        msg = msg.replace(/\{DB\}/g, codes.dark_blue);
        msg = msg.replace(/\{DG\}/g, codes.dark_green);
        msg = msg.replace(/\{LR\}/g, codes.light_red);
        msg = msg.replace(/\{DR\}/g, codes.dark_red);
        msg = msg.replace(/\{M\}/g, codes.magenta);
        msg = msg.replace(/\{O\}/g, codes.orange);
        msg = msg.replace(/\{Y\}/g, codes.yellow);
        msg = msg.replace(/\{LG\}/g, codes.light_green);
        msg = msg.replace(/\{C\}/g, codes.cyan);
        msg = msg.replace(/\{LC\}/g, codes.light_cyan);
        msg = msg.replace(/\{LB\}/g, codes.light_blue);
        msg = msg.replace(/\{LM\}/g, codes.light_magenta);
        msg = msg.replace(/\{G\}/g, codes.gray);
        msg = msg.replace(/\{LG\}/g, codes.light_gray);
        return msg;
    };
    this.clrs = this.colorize;

    this.connectionManager.on('data', function (connection, data) {
        connection.debug(data.toString());
    });

    this.connectionManager.on('message', function (connection, event) {
        if (event.message[0] === connection.config.callsign && !event.isAction) {
            var commandName = event.message.split(' ')[0].substr(1).toLowerCase(),
                text = event.message.substr(commandName.length + 2),
                eventObject = {
                    "channel": event.channel,
                    "user": event.user,
                    "message": event.message,
                    "name": commandName,
                    "text": text,
                    "params": text.length === 0 ? [] : text.split(' ')
                };
            self.commands.emit(commandName, connection, eventObject);
            self.connectionManager.emit('command', connection, eventObject);
            self.connectionManager.forEach(function (connection, id) {
                connection.emit('command', eventObject);
            });
        }
    });

    this.database = require('./database');

    this.scriptLoader = require('./scriptloader')(this);
    async.eachSeries(this.config.scripts, this.scriptLoader.load, function (err) {
        self.connectionManager.forEach(function (connection, id) {
            connection.debug = debug(id);
            connection.connect(function () {
                connection.write('MODE ' + config.irc.nick + ' +B');
            });
        });
    });
};