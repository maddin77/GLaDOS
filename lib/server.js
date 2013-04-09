module.exports = function(ip) {
	this.ip = ip;
	this.channels = [];
	this.users = [];
	this.motd = null;
	this.lastping = new Date();

	this.serverDB = STORAGE.database('server');
	if(!this.serverDB.existsSync()) {
		this.serverDB.createSync();
	}

	this.channelDB = STORAGE.database('channel');
	if(!this.channelDB.existsSync()) {
		this.channelDB.createSync();
	}

	this.userDB = STORAGE.database('user');
	if(!this.userDB.existsSync()) {
		this.userDB.createSync();
	}

	this.setMotd = function(motd) {
		this.motd = motd;
		this.save();
	};
	this.getMotd = function() {
		return this.motd;
	};

	this.getChannel = function(name) {
		for(var i = 0; i < this.channels.length; i++) {
			if(this.channels[i].getName() == name) return this.channels[i];
		}
		var _chan = new Channel(name, this.channelDB);
		this.channels.push(_chan);
		return _chan;
	};

	this.getUser = function(nick) {
		for(var i = 0; i < this.users.length; i++) {
			if(this.users[i].getNick() == nick) return this.users[i];
		}
		var _user = new User(nick, this.userDB);
		this.users.push(_user);
		return _user;
	};

	this.getLastPing = function() {
		return this.lastping;
	};

	this.save = function() {
		this.serverDB.postSync({
			"id": this.ip,
			"ip": this.ip,
			"motd": this.motd,
			"lastping": this.lastping
		});
	};
};
