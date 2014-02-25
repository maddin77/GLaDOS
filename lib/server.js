'use strict';
var Channel = require('./channel');
var User = require('./user');

var Server = module.exports = function (client, config, logger) {
    this.ip = config.get('irc:server');
    this.client = client;
    this.config = config;
    this.logger = logger;
    this.channels = [];
    this.users = [];
    this.motd = null;
    this.lastping = new Date();
};
Server.prototype.getIp = function () {
    return this.ip;
};
Server.prototype.setMotd = function (motd) {
    this.motd = motd;
};
Server.prototype.getMotd = function () {
    return this.motd;
};
Server.prototype.getChannel = function (name) {
    var i, chan;
    for (i = 0; i < this.channels.length; i += 1) {
        if (this.channels[i].getName() === name) {
            return this.channels[i];
        }
    }
    chan = new Channel(name, this);
    this.channels.push(chan);
    return chan;
};
Server.prototype.getUser = function (nick) {
    var i, user;
    for (i = 0; i < this.users.length; i += 1) {
        if (this.users[i].getNick() === nick) {
            return this.users[i];
        }
    }
    user = new User(nick, this);
    this.users.push(user);
    return user;
};
Server.prototype.getLastPing = function () {
    return this.lastping;
};