var Connection  = require('./connection');
var Emitter     = require('events').EventEmitter;
var util        = require('util');
var utils       = require('./utils');

var ConnectionManager = module.exports = function (config, stream) {
    this.connections = [];

    var self = this;

    if (config) {
        utils.toArray(config).forEach(function (cfg) {
            self.createConnection(cfg, stream);
        });
    }
};
util.inherits(ConnectionManager, Emitter);

ConnectionManager.prototype.createConnection = function (config, stream) {
    var con = new Connection(config, stream, this);
    this.connections[con.getId()] = con;
    return con;
};

ConnectionManager.prototype.removeConnection = function (id, callback) {
    var connection = this.getConnection(id), self = this;
    if (connection) {
        connection.disconnect(function () {
            delete self.connections[id];
            if (callback) {
                callback();
            }
        });
    }
};

ConnectionManager.prototype.getConnection = function (id) {
    if (id) {
        return this.connections[id] || null;
    }
    return this.connections;
};
ConnectionManager.prototype.getConnections = ConnectionManager.prototype.getConnection;

ConnectionManager.prototype.write = function (str) {
    var self = this;
    Object.keys(this.connections).forEach(function (id) {
        if (self.connections[id]) {
            self.connections[id].write(str);
        }
    });
};

ConnectionManager.prototype.forEach = function (callback) {
    var self = this;
    Object.keys(this.connections).forEach(function (id) {
        if (self.connections[id]) {
            callback(self.connections[id], id);
        }
    });
};