var KarmaPlugin = function() {
    this.incrementResponses = ["+1!", "gained a level!", "is on the rise!", "leveled up!"];
    this.decrementResponses = ["took a hit! Ouch.", "took a dive.", "lost a life.", "lost a level."];
};
KarmaPlugin.prototype.getKarma = function(nick, callback) {
    this.redis.hget("karma", nick, function (err, obj) {
        callback(parseInt(obj || 0, 10));
    });
};
KarmaPlugin.prototype.incKarma = function(nick, callback) {
    var that = this;
    this.getKarma(nick, function(karma) {
        that.redis.hset("karma", nick, karma+1);
        if(typeof(callback) == typeof(Function)) {
            callback(karma+1);
        }
    });
};
KarmaPlugin.prototype.decKarma = function(nick, callback) {
    var that = this;
    this.getKarma(nick, function(karma) {
        that.redis.hset("karma", nick, karma-1);
        if(typeof(callback) == typeof(Function)) {
            callback(karma-1);
        }
    });
};
KarmaPlugin.prototype.onCommand = function(server, channel, cmdName, params, user, msg, text) {
    if(cmdName == "karma") {
        if(params.length < 1) return user.notice("!karma <thing>");
        this.getKarma(params[0], function(karma) {
            channel.say(user.getNick() + ": " + params[0] + " has " + karma + " Karma.");
        });
        return true;
    }
};
KarmaPlugin.prototype.onChannelMessage = function(server, channel, user, text) {
    if( (match = /(\S+[^+:\s])[: ]*\+\+(\s|$)/ig.exec(text)) !== null) {
        var subject = match[1].toLowerCase();
        if(subject == user.getNick()) return;
        var resp = this.incrementResponses[Math.floor(Math.random() * this.incrementResponses.length)];
        this.incKarma(subject, function(karma) {
            channel.say(match[1] + " " + resp + " (Karma: " + karma + ")");
        });
    }
    else if( (match = /(\S+[^-:\s])[: ]*--(\s|$)/ig.exec(text)) !== null) {
        var _subject = match[1].toLowerCase();
        if(_subject == user.getNick()) return;
        var _resp = this.decrementResponses[Math.floor(Math.random() * this.decrementResponses.length)];
        this.decKarma(_subject, function(karma) {
            channel.say(match[1] + " " + _resp + " (Karma: " + karma + ")");
        });
    }
};
KarmaPlugin.prototype.onHelp = function(server, user, text) {
    user.say("Track arbitrary karma");
    user.say("Commands:");
    user.say("<thing>++ - give thing some karma");
    user.say("<thing>-- - take away some of thing's karma");
};
module.exports = new KarmaPlugin();