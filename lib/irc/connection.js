var net             = require('net');
var debug           = {
                        in: require('debug')('irc:>>'),
                        out: require('debug')('irc:<<')
                    };
var tls             = require('tls');
var _               = require('lodash');
var MessageStream   = require('irc-message-stream');
var replies         = require('irc-replies');
var Emitter         = require('eventemitter3').EventEmitter;
var util            = require('util');

function Connection (config, stream) {

    this.stream         = null;
    this.connectionInfo = {};

    this.config = config;

    this.config.object.connection = _.defaults(this.config.object.connection, {
        port:               6667,
        ssl:                false,
        rejectUnauthorized: false,
        //nick:               'GLaDOS',
        username:           config.nick,
        realname:           config.nick,
        password:           null,
        autoRejoin:         false,
        messageSplit:       512,
        quitmsg:            'bye'
    });
    this.config.save();

    this.use(require('./plugins/server')());
    this.use(require('./plugins/user')());
    this.use(require('./plugins/channel')());

    this.use(require('./plugins/away')());
    this.use(require('./plugins/invite')());
    this.use(require('./plugins/join')());
    this.use(require('./plugins/kick')());
    this.use(require('./plugins/mode')());
    this.use(require('./plugins/motd')());
    this.use(require('./plugins/names')());
    this.use(require('./plugins/nick')());
    this.use(require('./plugins/notice')());
    this.use(require('./plugins/part')());
    this.use(require('./plugins/ping')());
    this.use(require('./plugins/privmsg')());
    this.use(require('./plugins/quit')());
    this.use(require('./plugins/topic')());
    this.use(require('./plugins/welcome')());
    this.use(require('./plugins/whois')());

    if (stream) {
        this.stream = stream;
        this.connectToStream(stream);
        return;
    }
}
module.exports = Connection;
util.inherits(Connection, Emitter);


Connection.prototype.getStream = function () {
    return this.stream;
};

Connection.prototype.getInfo = function () {
    return this.connectionInfo;
};

Connection.prototype.write = function (str, fn) {
    this.stream.write(str + '\r\n', fn);
    this.emit('write', str);
    debug.out(str.toString());
};

Connection.prototype.connectToStream = function (stream, callback) {
    stream = stream || this.stream;
    stream.setEncoding('utf8');

    stream.on('connect', this.onConnect.bind(this));
    if (callback) {
        stream.on('connect', callback);
    }

    this.messageStream = new MessageStream;
    stream.pipe(this.messageStream);
    this.messageStream.on('data', this.onData.bind(this));
    stream.on('data', this.onRaw.bind(this));
};

Connection.prototype.connect = function (callback) {
    var self = this;
    if (this.config.object.connection.ssl) {
        this.stream = tls.connect(self.config.object.connection.port, self.config.object.connection.host, {
            rejectUnauthorized: self.config.object.connection.rejectUnauthorized
        }, function () {
            if (self.stream.authorized || self.stream.authorizationError === 'DEPTH_ZERO_SELF_SIGNED_CERT' || self.stream.authorizationError === 'CERT_HAS_EXPIRED' || self.stream.authorizationError === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE') {
                if (self.stream.authorizationError === 'CERT_HAS_EXPIRED') {
                    //console.log('Connecting to server with expired certificate');
                }
                self.stream.emit('connect');
            } else {
                //console.error('[SSL-Error]' + self.stream.authorizationError);
            }
        });
    } else {
        this.stream = net.connect({
            port: this.config.object.connection.port,
            host: this.config.object.connection.host
        });
    }
    this.connectToStream(this.stream, callback);
};

Connection.prototype.disconnect = function (message, callback) {
    if (_.isFunction(message)) {
        callback = message;
        message = undefined;
    }
    message = message || this.config.object.connection.quitmsg || 'bye';
    if (_.isFunction(callback)) {
        this.stream.once('end', callback);
    }
    var self = this;
    this.stream.write('QUIT ' + message + '\r\n', function () {
        self.stream.end();
    });
};

Connection.prototype.onConnect = function () {
    if (this.config.object.connection.password) {
        this.write('PASS ' + this.config.object.connection.password);
    }
    this.me = this.getUser(this.config.object.connection.nick);
    this.write('NICK ' + this.config.object.connection.nick);
    this.me.username = this.config.object.connection.username;
    this.me.realname = this.config.object.connection.realname;
    this.write('USER ' + this.config.object.connection.username + ' 0 * :' + this.config.object.connection.realname);
    this.write('MODE ' + this.config.object.connection.username + ' +B');
};

Connection.prototype.onData = function (message) {
    message.command = replies[message.command] || message.command;
    this.emit('data', message);
    debug.in(message.toString());
};

Connection.prototype.onRaw = function (data) {
    data = data.toString().trim();
    this.emit('raw', data);
};

Connection.prototype.use = function (callback) {
    callback(this);
    return this;
};