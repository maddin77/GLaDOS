var User = module.exports = function(nick, client, server, cfg, logger) {
    this.nick = nick;
    this.client = client;
    this.server = server;
    this.cfg = cfg;
    this.logger = logger;
    this.userName = "";
    this.host = "";
    this.serverName = "";
    this.realName = "";
    this.inChannels = [];
    this.account = "";
    this.idle = 0;
    this.onine = true;
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
User.prototype.setServer = function(serverName) {
    this.serverName = serverName;
};
User.prototype.getServer = function() {
    return this.serverName;
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
    var date = new Date().getTime();
    var that = this;
    this.client.whois(this.getNick(), function(info) {
        if(info.hasOwnProperty('user')) that.setUserName(info.user);
        if(info.hasOwnProperty('host')) that.setHost(info.host);
        if(info.hasOwnProperty('server')) that.setServer(info.server);
        if(info.hasOwnProperty('realname')) that.setRealname(info.realname);
        if(info.hasOwnProperty('account')) that.setAccount(info.account);
        if(info.hasOwnProperty("idle")) that.setIdleTime(info.idle);
        if(info.hasOwnProperty('channels')) {
            var _chans = [];
            for(var j in info.channels) {
                var mode = info.channels[j].split("#")[0];
                if(mode !== "") {
                    that.server.getChannel("#"+info.channels[j].split("#")[1]).addUserMode(info.nick, mode);
                }
                _chans.push("#"+info.channels[j].split("#")[1]);
            }
            that.setInChannels(_chans);
        }
        that.logger.info('Whois >> %s (finished in %sms)', that.getNick(), new Date().getTime() - date);
    });
};