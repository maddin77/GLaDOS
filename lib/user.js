module.exports = function(nick) {
    this.nick = nick;
    this.userName = "";
    this.host = "";
    this.server = "";
    this.realName = "";
    this.inChannels = [];
    this.account = "";
    this.idle = 0;
    this.onine = true;

    this.setNick = function(nick) {
        this.nick = nick;
        this.save();
    };
    this.getNick = function() {
        return this.nick;
    };

    this.setUserName = function(userName) {
        this.userName = userName;
        this.save();
    };
    this.getUserName = function() {
        return this.userName;
    };

    this.setHost = function(host) {
        this.host = host;
        this.save();
    };
    this.getHost = function() {
        return this.host;
    };

    this.setServer = function(server) {
        this.server = server;
        this.save();
    };
    this.getServer = function() {
        return this.server;
    };

    this.setRealname = function(realName) {
        this.realName = realName;
        this.save();
    };
    this.getRealname = function() {
        return this.realName;
    };

    this.setInChannels = function(inChannels) {
        this.inChannels = inChannels;
        this.save();
    };
    this.getInChannels = function() {
        return this.inChannels;
    };

    this.setAccount = function(account) {
        this.account = account;
        this.save();
    };
    this.getAccount = function() {
        return this.account;
    };

    this.setIdleTime = function(idle) {
        this.idle = idle;
        this.save();
    };
    this.getIdleTime = function() {
        return this.idle;
    };

    this.isOnline = function() {
        return this.online;
    };
    this.setOnline = function() {
        this.online = true;
        this.save();
    };
    this.setOffline = function() {
        this.online = false;
        this.save();
    };

    this.hasPermissions = function() {
        return CONFIG.get('permissions').indexOf(this.nick) != -1;
    };

    this.save = function() {
        DATABASE.query("INSERT INTO `user` (`nick`,`userName`,`host`,`server`,`realName`,`inChannels`,`account`,`idle`) VALUES (?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE `userName` = ?, `host` = ?, `server` = ?, `realName` = ?, `inChannels` = ?, `account` = ?, `idle` = ?", [
            this.nick, this.userName, this.host, this.server, this.realName, this.inChannels.join(","), this.account, this.idle,this.userName, this.host, this.server, this.realName, this.inChannels.join(","), this.account, this.idle
        ], function(err, results) {
            if(err) QUIT(1,err);
        });
    };
};