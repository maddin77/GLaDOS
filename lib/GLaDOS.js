'use strict';
var debug = require('debug')('GLaDOS');
var tls = require('tls');
var net = require('net');
var EventEmitter = require('events').EventEmitter;

module.exports = function (config, coffea, brain) {
    var stream, client, commands;

    commands = new EventEmitter();

    if (config.irc.ssl === true) {
        debug('Using secure connection.');
        stream  = tls.connect(config.irc.port, config.irc.host, {
            rejectUnauthorized: false
        }, function () {
            if (!stream.authorized) {
                if (stream.authorizationError === 'DEPTH_ZERO_SELF_SIGNED_CERT') {
                    debug('Connecting to server with self-signed certificate.');
                } else if (stream.authorizationError === 'CERT_HAS_EXPIRED') {
                    debug('Connecting to server with expired certificate.');
                } else {
                    debug('Unknown SSL-Error: ' + stream.authorizationError);
                }
            }
        });
    } else {
        debug('Using non-secure connection.');
        stream = net.connect({
            "port": config.irc.port,
            "host": config.irc.host
        });
    }

    stream.on('end', function (event) {
        brain.quit(function (err, res) {
            if (err) {
                debug('Disconnected from redis... %s', err);
            } else {
                debug('Disconnected from redis... %s', res);
            }
        });
    });

    client = coffea(stream);

    client.pass(config.irc.pass);
    client.nick(config.irc.nick);
    client.user(config.irc.user[0], config.irc.user[1]);
    client.mode(config.irc.nick, '+B');

    client.on('data', function (msg) {
        debug(msg.string);
    });

    /* extend coffea client */
    client.brain = brain;
    client.config = config;

    client.command = function (names, fn) {
        if (!(names instanceof Array)) {
            names = [names];
        }
        names.forEach(function (name) {
            debug('Command registered: %s', name);
            commands.on(name, fn);
        });
    };

    client.colorize = function (msg) {
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
    client.clrs = client.colorize;

    client.on('message', function (event) {
        if (event.message[0] === '!' && !event.isAction) {
            var commandName = event.message.split(' ')[0].substr(1).toLowerCase(),
                text = event.message.substr(commandName.length + 2);
            commands.emit(commandName, {
                "channel": event.channel,
                "user": event.user,
                "message": event.message,
                "name": commandName,
                "text": text,
                "params": text.length === 0 ? [] : text.split(' ')
            });
            client.emit('command', {
                "channel": event.channel,
                "user": event.user,
                "message": event.message,
                "name": commandName,
                "text": text,
                "params": text.length === 0 ? [] : text.split(' ')
            });
        }
    });

    return {
        require: function (name) {
            debug('Loading Script: %s', name);
            require(name)(client);
        }
    };
};