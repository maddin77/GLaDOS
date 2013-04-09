module.exports = {
	_cacheFile: 'storage/urltitle.cache.json',
	_cache: [],
	onChannelMessage: function(client, server, channel, user, message) {
		var urls = UTIL.findUrls(message);
		if(urls.length > 0) {

			for(var i in this._cache) {
				if(this._cache[i].url == urls[0]) {
					client.say(channel.getName(), "Title: " + this._cache[i].title + " (" + this._cache[i].hostName + ")");
					return;
				}
			}
			var that = this;
			REQUEST(urls[0], function (error, response, body) {
				if (!error && response.statusCode == 200) {
					var $ = CHEERIO.load(body);
					var title = $('title').text();
					var hostName = UTIL.getHostName(urls[0]);
					client.say(channel.getName(), "Title: " + title + " (" + hostName + ")");
					that._cache.push({
						"url": urls[0],
						"title": title,
						"hostName": hostName
					});
					FS.writeFile(that._cacheFile, JSON.stringify(that._cache, null, '\t'), {encoding: 'utf8'}, function(err) {
						if(err) throw err;
					});
				}
			});
		}
	},
	onLoad: function() {
		if(!FS.existsSync(this._cacheFile)) {
			FS.writeFileSync(this._cacheFile, '[]');
		}
		else {
			var data = FS.readFileSync(this._cacheFile, {encoding: 'utf8'});
			if(data !== "") {
				this._cache = JSON.parse(data);
			}
			else {
				this._cache = [];
			}
		}
	},
	onUnload: function() {
		if(this._cache !== null) {
			FS.writeFileSync(this._cacheFile, JSON.stringify(this._cache, null, '\t'), {encoding: 'utf8'});
		}
		this._cache = null;
	}
};