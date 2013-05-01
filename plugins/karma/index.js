module.exports = {
    _karma: [],
    getKarma: function(nick) {
        for (var i = 0; i < this._karma.length; i++) {
            if(nick == this._karma[i].nick) return this._karma[i];
        }
        var obj = {
            "nick": nick,
            "value": 0,
            "lastBy": '',
            "lastTime": ''
        };
        this._karma.push(obj);
        return obj;
    },
    addKarma: function(from, to) {
        for (var i = 0; i < this._karma.length; i++) {
            if(to == this._karma[i].nick) {
                this._karma[i].value += 1;
                this._karma[i].lastBy = from;
                this._karma[i].lastTime = new Date().toString();
                return;
            }
        }
        var obj = {
            "nick": to,
            "value": 1,
            "lastBy": from,
            "lastTime": new Date().toString()
        };
        this._karma.push(obj);
    },
    onCommand: function(client, server, channel, commandChar, name, params, user, text, message) {
        if(name == "karma") {
            if(params.length === 0) {
                client.say(channel.getName(), user.getNick() + ": Du hast " + this.getKarma(user.getNick()).value + " Karma.");
            }
            else {
                client.say(channel.getName(), user.getNick() + ": " + params[0] + " hat " + this.getKarma(params[0]).value + " Karma.");
            }
        }
    },
    onChannelMessage: function(client, server, channel, user, message) {
        var that = this;
        message.rmatch("^(.*): \\+(1|\\+)$", function(match) {
            if(channel.userExistInChannel(match[1])) {
                that.addKarma(user.getNick(), match[1]);
                that.save();
                console.log("addKarma(" + user.getNick() + ", " + match[1] + ")");
            }
        });
    },
    onLoad: function() {
        DATABASE.query("CREATE TABLE IF NOT EXISTS `karma` (`nick` varchar(255) NOT NULL DEFAULT '',`value` int(11) DEFAULT NULL,`lastBy` varchar(255) DEFAULT NULL,`lastTime` varchar(255) DEFAULT NULL,PRIMARY KEY (`nick`)) ENGINE=InnoDB DEFAULT CHARSET=utf8;");
        var that = this;
        DATABASE.query("SELECT * FROM `karma`", function(err, results) {
            if(err) {
                console.error(err);
                QUIT(1);
            }
            else {
                that._karma = results;
            }
        });
    },
    save: function() {
        for (var i = 0; i < this._karma.length; i++) {
            DATABASE.query("INSERT INTO `karma` VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE `value` = ?, `lastBy` = ?, `lastTime` = ?", [
                this._karma[i].nick, this._karma[i].value, this._karma[i].lastBy, this._karma[i].lastTime, this._karma[i].value, this._karma[i].lastBy, this._karma[i].lastTime
            ], function(err) {
                if(err) {
                    console.error(err);
                    QUIT(1);
                }
            });
        }
    },
    onUnload: function() {
        this.save();
    },
    onHelpRequest: function(client, server, user, message, parts) {
        client.say(user.getNick(), "# Beschreibung:");
        client.say(user.getNick(), "#   Wenn du mit dem was ein Benutzer sagt einverstanden bist, gib ihm Karma :D");
        client.say(user.getNick(), "# Verwendung:");
        client.say(user.getNick(), "#   !karma");
        client.say(user.getNick(), "#   !karma <Nick>");
        client.say(user.getNick(), "#   <Nick>: ++");
        client.say(user.getNick(), "#   <Nick>: +1");
    }
};