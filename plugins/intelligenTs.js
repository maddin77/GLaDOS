module.exports = {
	_file: 'storage/intelligenTs.json',
	_intelligenTs: null,

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
		if(this._intelligenTs !== null) {
			FS.writeFile(this._file, JSON.stringify(this._intelligenTs, null, '\t'), {encoding: 'utf8'}, function(err) {
				if (err) throw err;
			});
		}
	},
	onLoad: function() {
		if(!FS.existsSync(this._file)) {
			FS.writeFileSync(this._file, '{}');
		}
		else {
			var data = FS.readFileSync(this._file, {encoding: 'utf8'});
			if(data !== "") {
				this._intelligenTs = JSON.parse(data);
			}
			else {
				this._intelligenTs = {};
			}
		}
	},
	onUnload: function() {
		if(this._intelligenTs !== null) {
			FS.writeFileSync(this._file, JSON.stringify(this._intelligenTs, null, '\t'), {encoding: 'utf8'});
		}
	}
};