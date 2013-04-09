module.exports = function(name, channelDB) {
	this.name = name;
	this.channelDB = channelDB;
	this.userCount = 0;
	this.topic = {
		"nick": null,
		"topic": null,
		"time": null
	};
	this.modes = [];

	this.getName = function() {
		return this.name;
	};

	this.setUserCount = function(count) {
		this.userCount = count;
		this.save();
	};
	this.getUserCount = function() {
		return this.userCount;
	};

	this.setTopic = function(topic) {
		this.topic = topic;
		this.save();
	};
	this.getTopic = function() {
		return this.topic;
	};

	this.setMode = function(mode) {
		for(var i=0; i<this.modes.length; i++) {
			if(this.modes[i] == mode) return;
		}
		this.modes.push(mode);
		this.save();
	};
	this.removeMode = function(mode) {
		var pos = -1;
		for(var i=0; i<this.modes.length; i++) {
			if(this.modes[i] == mode) pos = i;
		}
		if(pos != -1) {
			this.modes.splice(pos,1);
		}
		this.save();
	};
	this.getModes = function() {
		return this.modes;
	};

	this.save = function() {
		this.channelDB.postSync({
			"id": this.name,
			"name": this.name,
			"userCount": this.userCount,
			"topic": this.topic,
			"modes": this.modes
		});
	};
};