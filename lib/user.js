var User = module.exports = function(nick, client, cfg) {
    this.nick = nick;
    this.client = client;
    this.cfg = cfg;
    this.userName = "";
    this.host = "";
    this.server = "";
    this.realName = "";
    this.inChannels = [];
    this.account = "";
    this.idle = 0;
    this.onine = true;
    this.whoisTime = new Date().getTime();
};
User.prototype.setNick = function(nick) {
    this.nick = nick;
};
User.prototype.getNick = function() {
    return this.nick;
};
User.prototype.setUserName = function(userName) {
    this.userName = userName;
};
User.prototype.getUserName = function() {
    return this.userName;
};
User.prototype.setHost = function(host) {
    this.host = host;
};
User.prototype.getHost = function() {
    return this.host;
};
User.prototype.setServer = function(server) {
    this.server = server;
};
User.prototype.getServer = function() {
    return this.server;
};
User.prototype.setRealname = function(realName) {
    this.realName = realName;
};
User.prototype.getRealname = function() {
    return this.realName;
};
User.prototype.setInChannels = function(inChannels) {
    this.inChannels = inChannels;
};
User.prototype.getInChannels = function() {
    return this.inChannels;
};
User.prototype.setAccount = function(account) {
    this.account = account;
};
User.prototype.getAccount = function() {
    return this.account;
};
User.prototype.setIdleTime = function(idle) {
    this.idle = idle;
};
User.prototype.getIdleTime = function() {
    return this.idle;
};
User.prototype.isOnline = function() {
    return this.online;
};
User.prototype.setOnline = function() {
    this.online = true;
};
User.prototype.setOffline = function() {
    this.online = false;
};
User.prototype.hasPermissions = function() {
    return this.cfg.get('permissions').indexOf(this.nick) != -1;
};
User.prototype.say = function(msg) {
    this.client.say(this.getNick(), msg);
};
User.prototype.notice = function(msg) {
    this.client.notice(this.getNick(), msg);
};
User.prototype.whois = function() {
    this.whoisTime = new Date().getTime();
    this.client.whois(this.getNick());
};