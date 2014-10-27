var User = module.exports = function (nick, connection) {
    this.nick = nick;
    this.connection = connection;
    this.username = '';
    this.realname = '';
    this.hostname = '';
    this.channels = {};
    this.server = '';
    this.serverInfo = '';
    this.away = null;
    this.account = null;
    this.registered = false;
    this.secure = false;
    this.idle = 0;
    this.signon = new Date();
    this.oper = false;
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

User.prototype.getChannels = function () {
    return this.channels; // {'#channel': ['~']}
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

User.prototype.isOper = function () {
    return this.oper;
};

User.prototype.isAdmin = function () {
    console.log('isAdmin', this.connection.config.admin, this.nick, this.connection.config.admin.indexOf(this.nick));
    return this.connection.config.admin.indexOf(this.nick) > -1;
};

User.prototype.getConnection = function () {
    return this.connection;
};

User.prototype.notice = function () {
    var args = Array.prototype.slice.call(arguments);
    args.unshift(this.getNick());
    this.connection.notice.apply(this.connection.notice, args);
    return this;
};

User.prototype.say = function () {
    var args = Array.prototype.slice.call(arguments);
    args.unshift(this.getNick());
    this.connection.send.apply(this.connection.send, args);
    return this;
};

User.prototype.whois = function (fn) {
    this.connection.whois(this.getNick(), fn);
    return this;
};