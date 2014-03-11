'use strict';
var debug = require('debug')('glados:irc:channel');

var Channel = module.exports = function (name, client) {
    debug('Channel created: %s', name);
    this.name = name;
    this.client = client;
    this.topic = {};
    this.names = {};
};

Channel.prototype.toString = function () {
    return this.name;
};

Channel.prototype.getName = function () {
    return this.name;
};

Channel.prototype.getTopic = function () {
    return this.topic;
};

Channel.prototype.say = function (msg) {
    this.client.send(this.getName(), msg);
};

Channel.prototype.getNames = function () {
    return this.names; // {'nick': '~'}
};

Channel.prototype.userHasMode = function (nick, mode) {
    nick = typeof nick === "string" ? nick : nick.getNick();
    if (this.names.hasOwnProperty(nick)) {
        return this.names[nick] === mode;
    }
    return false;
};

Channel.prototype.userHasMinMode = function (nick, mode) {
    nick = typeof nick === "string" ? nick : nick.getNick();
    switch (mode) {
    case 'Y':
    case '!':
        return this.userHasMode(nick, '!');
    case 'q':
    case '~':
        return this.userHasMode(nick, '!') || this.userHasMode(nick, '~');
    case 'a':
    case '&':
        return this.userHasMode(nick, '!') || this.userHasMode(nick, '~') || this.userHasMode(nick, '&');
    case 'o':
    case '@':
        return this.userHasMode(nick, '!') || this.userHasMode(nick, '~') || this.userHasMode(nick, '&') || this.userHasMode(nick, '@');
    case 'h':
    case '%':
        return this.userHasMode(nick, '!') || this.userHasMode(nick, '~') || this.userHasMode(nick, '&') || this.userHasMode(nick, '@') || this.userHasMode(nick, '%');
    case 'v':
    case '+':
        return this.userHasMode(nick, '!') || this.userHasMode(nick, '~') || this.userHasMode(nick, '&') || this.userHasMode(nick, '@') || this.userHasMode(nick, '%') || this.userHasMode(nick, '+');
    default:
        return false;
    }
};

Channel.prototype.isUserInChannel = function (nick) {
    nick = typeof nick === "string" ? nick : nick.getNick();
    return this.names.hasOwnProperty(nick);
};

Channel.prototype.notice = function (msg) {
    this.irc.notice(this.getName(), msg);
};

Channel.prototype.reply = function (nick, msg) {
    nick = typeof nick === "string" ? nick : nick.getNick();
    this.say(nick + ': ' + msg);
};

Channel.prototype.kick = function (nick, reason) {
    this.client.kick(this.getName(), nick, reason);
};

Channel.prototype.ban = function (mask) {
    this.client.write('MODE ' + this.getName() + ' +b ' + mask);
};
Channel.prototype.unban = function (mask) {
    this.client.write('MODE ' + this.getName() + ' -b ' + mask);
};