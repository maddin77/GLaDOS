module.exports = {
	_intDB: STORAGE.database('intelligenTs'),
	_intelligenTs: {},

	onCommand: function(client, server, channel, commandChar, name, params, user, text, message) {
		if(name == "intelligenTs") {
			if( params.length === 0 ) return client.notice(user.getNick(), commandChar + name + " <Nick>");
			var _nick = params[0];
			var _user = server.getUser(_nick);
			if(_user === null) return client.notice(user.getNick(), "\"" + _nick + "\" existiert nicht.");
			var by = user.getNick(), val = 1;

			if(this._intelligenTs.hasOwnProperty(_nick)) {
				this._intelligenTs[_nick].value += 1;
				val = this._intelligenTs[_nick].value;
				this._intelligenTs[_nick].lastTime = new Date();
				this._intelligenTs[_nick].lastBy = by;
			}
			else {
				val = 1;
				this._intelligenTs[_nick] = {
					"value": val,
					"lastTime": new Date(),
					"lastBy": by
				};
			}
			client.say(channel.getName(), user.getNick() + ": IntelligenTs von " + _nick + " um 1 erhöht (aktuelle IntelligenTs: " + val + ")");
			this.save();
		}
	},
	save: function() {
		this._intelligenTs['id'] = "intelligenTs";
		this._intDB.postSync(this._intelligenTs);
	},
	onLoad: function() {
		if(!this._intDB.existsSync()) {
			this._intDB.createSync();
			this.save();
		}
		else {
			this._intelligenTs = this._intDB.getSync('intelligenTs');
		}
	},
	onUnload: function() {
		this.save();
	}
};