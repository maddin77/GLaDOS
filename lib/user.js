module.exports = function(nick, userDB) {
	this.nick = nick;
	this.userDB = userDB;
	this.modes = [];
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

	this.setMode = function(mode, add) {
		if(add) {
			var has = false;
			for(var i=0; i<this.modes.length; i++) {
				if(this.modes[i] == mode) return;
			}
			this.modes.push(mode);
			this.save();
		}
		else {
			for(var j=0; j<this.modes.length; j++) {
				if(this.modes[j] == mode) {
					this.modes.splice(j,1);
					this.save();
					return;
				}
			}
		}
	};

	this.hasMode = function(mode) {
		for(var i=0; i<this.modes.length; i++) {
			if(this.modes[i] == mode) {
				return true;
			}
		}
		return false;
	};

	this.hasMinMode = function(mode) {
		switch(mode) {
			case "~": return this.hasMode("~");
			case "&": return this.hasMode("~") || this.hasMode("&");
			case "@": return this.hasMode("~") || this.hasMode("&") || this.hasMode("@");
			case "%": return this.hasMode("~") || this.hasMode("&") || this.hasMode("@") || this.hasMode("%");
			case "+": return this.hasMode("~") || this.hasMode("&") || this.hasMode("@") || this.hasMode("%") || this.hasMode("+");
			default: return false;
		}
	};

	this.getModes = function() {
		return this.modes;
	};

	this.hasPermissions = function() {
		return CONFIG.permissions.indexOf(this.nick) != -1;
	};

	this.save = function() {
		this.userDB.postSync({
			"id": this.nick,
			"nick": this.nick,
			"modes": this.modes,
			"userName": this.userName,
			"host": this.host,
			"server": this.server,
			"realName": this.realName,
			"inChannels": this.inChannels,
			"account": this.account,
			"idle": this.idle,
			"onine": this.onine
		});
	};
};