'use strict';
var util    = require('util'),
    winston = require('winston');

var CustomLogger = module.exports = winston.transports.CustomerLogger = function (options) {
    this.name       = 'customLogger';
    this.terminal   = options.terminal || true;
    this.sockets    = options.sockets || false;
    this.backlogmax = options.backlogmax || 1000;
    this.backlog    = [];
    this.level      = 'silly';

    if (this.sockets) {
        var app = require('http').createServer(),
            self = this;
        this.socketIO = require('socket.io').listen(app);
        this.socketIO.set('transports', ['xhr-polling']);
        this.socketIO.set('log level', 1);
        this.socketIO.sockets.on('connection', function (socket) {
            var address = socket.handshake.address;
            self.addBacklog('warn', 'New connection from ' + address.address + ':' + address.port, socket.handshake);
            self.backlog.forEach(function (bl) {
                socket.emit('logging', bl.level, bl.message, bl.meta, bl.date);
            });
        });
        app.listen(process.env.VMC_APP_PORT || 80);
    }
};

util.inherits(CustomLogger, winston.Transport);

CustomLogger.prototype.log = function (level, message, meta, callback) {
    if (this.terminal) {
        var output = this.getTime() + ' - ' + this.getColorLevel(level) + ': ' + message.stripColors;
        if (level === 'error' || level === 'debug') {
            process.stderr.write(output + '\n');
        } else {
            process.stdout.write(output + '\n');
        }
    }
    if (this.sockets) {
        this.socketIO.sockets.emit('logging', level, message, meta, new Date());
        this.addBacklog(level, message, meta);
    }
    callback(null, true);
};

CustomLogger.prototype.getTime = function () {
    var date = new Date();
    return this.pad(date.getHours(), 2) + ':' + this.pad(date.getMinutes(), 2) + ':' + this.pad(date.getSeconds(), 2) + ':' + this.pad(date.getMilliseconds(), 3);
};

CustomLogger.prototype.getColorLevel = function (level) {
    var clrLvl;
    if (level === 'silly') {
        clrLvl = level.magenta;
    } else if (level === 'input') {
        clrLvl = level.grey;
    } else if (level === 'verbose') {
        clrLvl = level.cyan;
    } else if (level === 'prompt') {
        clrLvl = level.grey;
    } else if (level === 'debug') {
        clrLvl = level.blue;
    } else if (level === 'info') {
        clrLvl = level.green;
    } else if (level === 'data') {
        clrLvl = level.grey;
    } else if (level === 'help') {
        clrLvl = level.cyan;
    } else if (level === 'warn') {
        clrLvl = level.yellow;
    } else if (level === 'error') {
        clrLvl = level.red;
    }
    return clrLvl;
};

CustomLogger.prototype.addBacklog = function (level, message, meta) {
    if (this.backlog.length >= this.backlogmax) {
        this.backlog.splice(0, 1);
    }
    this.backlog.push({
        'level': level,
        'message': message,
        'meta': meta,
        'date': new Date()
    });
};

CustomLogger.prototype.pad = function (num, len) {
    var s = '000000000' + num;
    return s.substr(s.length - len);
};