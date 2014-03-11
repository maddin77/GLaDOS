'use strict';
var debug = require('debug')('glados:irc:user');

var User = module.exports =  function (nick, client) {
    debug('User created: %s', nick);
    this.nick = nick;
    this.client = client;

    this.username = '';
    this.realname = '';
    this.hostname = '';
    this.channel = {};
    this.server = '';
    this.serverInfo = '';
    this.away = '';
    this.account = '';
    this.registered = false;
    this.secure = false;
    this.idle = 0;
    this.signon = new Date();

    //this.whois();
};

User.prototype.toString = function () {
    return this.nick + '!' + this.username + '@' + this.hostname;
};

User.prototype.getNick = function () {
    return this.nick;
};

User.prototype.getUsername = function () {
    return this.username;
};

User.prototype.getRealname = function () {
    return this.realname;
};

User.prototype.getHostname = function () {
    return this.hostname;
};

User.prototype.isAdmin = function () {
    return this.client.config.admin.indexOf(this.getNick()) > -1;
};

User.prototype.getChannels = function () {
    return this.channel; // {'#channel': '~'}
};

User.prototype.getServer = function () {
    return this.server;
};

User.prototype.getServerInfo = function () {
    return this.serverInfo;
};

User.prototype.getAway = function () {
    return this.away;
};

User.prototype.getAccount = function () {
    return this.account;
};

User.prototype.isRegistered = function () {
    return this.registered;
};

User.prototype.isUsingSecureConnection = function () {
    return this.secure;
};

User.prototype.getIdle = function () {
    return this.idle;
};

User.prototype.getSignonTime = function () {
    return this.signon;
};

User.prototype.notice = function (msg) {
    this.client.notice(this.getNick(), msg);
};

User.prototype.whois = function (fn) {
    this.client.whois(this.getNick(), fn);
};