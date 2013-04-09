module.exports.Storage = function(name, formatting) {
	this.name = name;
	this.file = "storage/"+name+".json";
	this.formatting = formatting;
	this._data = {};
	
	this.load = function() {
		if(!FS.existsSync(this.file)) {
			FS.writeFileSync(this.file, '{}');
		}
		else {
			var data = FS.readFileSync(this.file, {encoding: 'utf8'});
			if(data !== "") {
				this._data = JSON.parse(data);
			}
			else {
				this._data = {};
			}
		}
	};
	this.save = function() {
		var data = this.formatting ? JSON.stringify(this._data, null, '\t') : JSON.stringify(this._data);
		FS.writeFile(this.file, data, {encoding: 'utf8'}, function(err) {
			if(err) throw err;
		});
	};
	
	this.set = function(key, value) {
		this._data[key] = value;
	};
	this.get = function(key) {
		if( this._data.hasOwnProperty(key) ) {
			return this._data[key];
		}
		else {
			return null;
		}
	};
	
	this.load();
}
