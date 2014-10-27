var net             = require('net');
var tls             = require('tls');
var _               = require('underscore');
var MessageStream   = require('irc-message-stream');
var replies         = require('irc-replies');
var Emitter         = require('events').EventEmitter;
var util            = require('util');

function Connection(config, stream, conManager) {
    this.stream         = null;
    this.connectionInfo = {};
    this.conManager     = conManager;

    this.config         = _.defaults(config, {
        //Required params
        //  host: "",
        //  nickname: "",
        //- OR -
        //  nick: "",
        port:               6667,
        id:                 _.uniqueId('server_'),
        ssl:                false,
        rejectUnauthorized: false,
        username:           config.nickname || config.nick,
        realname:           config.nickname || config.nick,
        password:           null,
        autoRejoin:         false,
        autoConnect:        false,
        messageSplit:       512,
        channels:           [],
        quitmsg:            'bye'
    });
    this.config.nickname = this.config.nick = this.config.nickname || this.config.nick;

    this.use(require('./plugins/server')());
    this.use(require('./plugins/user')());
    this.use(require('./plugins/channel')());

    this.use(require('./plugins/away')());
    this.use(require('./plugins/command')());
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
    if (this.config.autoConnect) {
        this.connect();
    }
}
module.exports = Connection;
util.inherits(Connection, Emitter);

Connection.prototype.getConnectionManager = function () {
    return this.conManager;
};

Connection.prototype.getStream = function () {
    return this.stream;
};

Connection.prototype.getInfo = function () {
    return this.connectionInfo;
};

Connection.prototype.getId = function () {
    return this.config.id;
};

Connection.prototype.write = function (str, fn) {
    this.stream.write(str + '\r\n', fn);
    this.emit('write', str);
    this.conManager.emit('write', this, str);
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
    if (this.config.ssl) {
        this.stream = tls.connect(self.config.port, self.config.host, {
            rejectUnauthorized: self.config.rejectUnauthorized
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
            port: this.config.port,
            host: this.config.host
        });
    }
    this.connectToStream(this.stream, callback);
};

Connection.prototype.disconnect = function (message, callback) {
    if (_.isFunction(message)) {
        callback = message;
        message = undefined;
    }
    message = message || this.config.quitmsg || 'bye';
    if (_.isFunction(callback)) {
        this.stream.once('end', callback);
    }
    var self = this;
    this.stream.write('QUIT ' + message + '\r\n', function () {
        self.stream.end();
    });
};

Connection.prototype.onConnect = function () {
    this.write('PASS ' + this.config.password);
    this.me = this.getUser(this.config.nickname);
    this.write('NICK ' + this.config.nickname);
    this.me.username = this.config.username;
    this.me.realname = this.config.realname;
    this.write('USER ' + this.config.username + ' 0 * :' + this.config.realname);
};

Connection.prototype.onData = function (message) {
    message.command = replies[message.command] || message.command;
    this.emit('data', message);
    this.conManager.emit('data', this, message);
};

Connection.prototype.onRaw = function (data) {
    data = data.toString().trim();
    this.emit('raw', data);
    this.conManager.emit('raw', this, data);
};

Connection.prototype.use = function (callback) {
    callback(this);
    return this;
};