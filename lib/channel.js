module.exports = function(name) {
    this.name = name;
    this.userCount = 0;
    this.topic = {
        "nick": null,
        "topic": null,
        "time": null
    };
    this.modes = [];
    this.userModes = {};

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

    this.userExistInChannel = function(nick) {
        var chans = SERVER.getUser(nick).getInChannels();
        for(var i=0; i<chans.length; i++) {
            if(chans[i] == this.name) return true;
        }
        return false;
    };

    this.addUserMode = function(nick, mode) {
        if(!this.userHasMode(nick, mode)) {
            this.userModes[nick].push(mode);
        }
    };
    this.remUserMode = function(nick, mode) {
        if(this.userHasMode(nick, mode)) {
           var index = this.userModes[nick].indexOf(mode);
           if(index !== -1) {
                this.userModes[nick].splice(index,1);
           }
        }
    };
    this.userHasMode = function(nick, mode) {
        if(this.userModes.hasOwnProperty(nick)) {
            for(var i=0; i<this.userModes[nick].length; i++) {
                if(this.userModes[nick][i] == mode) return true;
            }
            return false;
        }
        else {
            this.userModes[nick] = [];
            return false;
        }
    };
    this.userHasMinMode = function(nick, mode) {
        switch(mode) {
            case "~": return this.userHasMode(nick, "~");
            case "&": return this.userHasMode(nick, "~") || this.userHasMode(nick, "&");
            case "@": return this.userHasMode(nick, "~") || this.userHasMode(nick, "&") || this.userHasMode(nick, "@");
            case "%": return this.userHasMode(nick, "~") || this.userHasMode(nick, "&") || this.userHasMode(nick, "@") || this.userHasMode(nick, "%");
            case "+": return this.userHasMode(nick, "~") || this.userHasMode(nick, "&") || this.userHasMode(nick, "@") || this.userHasMode(nick, "%") || this.userHasMode(nick, "+");
            default: return false;
        }
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
        DATABASE.query("INSERT INTO `channel` (`name`,`userCount`,`topic`,`modes`) VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE `userCount` = ?, `topic` = ?, `modes` = ?", [
            this.name,this.userCount,this.topic.topic,this.modes.join(","),this.userCount,this.topic.topic,this.modes.join(",")
        ], function(err, results) {
            if(err) {
                console.error(err);
                QUIT(1);
            }
        });
    };
};