var Channel = require('./channel.js');
var User = require('./user.js');
var Server = module.exports = function(ip, client, cfg, logger) {
    this.ip = ip;
    this.client = client;
    this.cfg = cfg;
    this.logger = logger;
    this.channels = [];
    this.users = [];
    this.motd = null;
    this.lastping = new Date();
};
Server.prototype.setMotd = function(motd) {
    this.motd = motd;
};
Server.prototype.getMotd = function() {
    return this.motd;
};
Server.prototype.getChannel = function(name) {
    for(var i = 0; i < this.channels.length; i++) {
        if(this.channels[i].getName() == name) return this.channels[i];
    }
    var _chan = new Channel(name, this.client, this);
    this.channels.push(_chan);
    return _chan;
};
Server.prototype.getUser = function(nick) {
    for(var i = 0; i < this.users.length; i++) {
        if(this.users[i].getNick() == nick) return this.users[i];
    }
    var _user = new User(nick, this.client, this, this.cfg, this.logger);
    this.users.push(_user);
    return _user;
};
Server.prototype.getLastPing = function() {
    return this.lastping;
};
