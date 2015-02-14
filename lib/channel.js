var Channel = module.exports = function(name, client, server) {
    this.name = name;
    this.client = client;
    this.server = server;
    this.userCount = 0;
    this.topic = {
        "nick": null,
        "topic": null,
        "time": null
    };
    this.modes = [];
    this.userModes = {};
};
Channel.prototype.getName = function() {
    return this.name;
};
Channel.prototype.setUserCount = function(count) {
    if(count == "++") this.userCount++;
    else if(count == "--") this.userCount--;
    else this.userCount = count;
};
Channel.prototype.getUserCount = function() {
    return this.userCount;
};
Channel.prototype.setTopic = function(topic) {
    this.topic = topic;
};
Channel.prototype.getTopic = function() {
    return this.topic;
};
Channel.prototype.userExistInChannel = function(nick) {
    var chans = this.server.getUser(nick).getInChannels();
    for(var i=0; i<chans.length; i++) {
        if(chans[i] == this.name) return true;
    }
    return false;
};
Channel.prototype.addUserMode = function(nick, mode) {
    if(!this.userHasMode(nick, mode)) {
        this.userModes[nick].push(mode);
    }
};
Channel.prototype.remUserMode = function(nick, mode) {
    if(this.userHasMode(nick, mode)) {
       var index = this.userModes[nick].indexOf(mode);
       if(index !== -1) {
            this.userModes[nick].splice(index,1);
       }
    }
};
Channel.prototype.userHasMode = function(nick, mode) {
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
Channel.prototype.userHasMinMode = function(nick, mode) {
    switch(mode) {
        case "~": return this.userHasMode(nick, "~");
        case "&": return this.userHasMode(nick, "~") || this.userHasMode(nick, "&");
        case "@": return this.userHasMode(nick, "~") || this.userHasMode(nick, "&") || this.userHasMode(nick, "@");
        case "%": return this.userHasMode(nick, "~") || this.userHasMode(nick, "&") || this.userHasMode(nick, "@") || this.userHasMode(nick, "%");
        case "+": return this.userHasMode(nick, "~") || this.userHasMode(nick, "&") || this.userHasMode(nick, "@") || this.userHasMode(nick, "%") || this.userHasMode(nick, "+");
        default: return false;
    }
};
Channel.prototype.setMode = function(mode) {
    for(var i=0; i<this.modes.length; i++) {
        if(this.modes[i] == mode) return;
    }
    this.modes.push(mode);
};
Channel.prototype.removeMode = function(mode) {
    var pos = -1;
    for(var i=0; i<this.modes.length; i++) {
        if(this.modes[i] == mode) pos = i;
    }
    if(pos != -1) {
        this.modes.splice(pos,1);
    }
};
Channel.prototype.getModes = function() {
    return this.modes;
};
Channel.prototype.say = function(msg) {
    this.client.say(this.getName(), msg);
};
Channel.prototype.kick = function(nick, reason) {
    this.client.send('KICK', this.getName(), nick, reason);
};
Channel.prototype.ban = function(mask) {
    this.client.send('MODE', this.getName(), "+b", mask);
};
Channel.prototype.unban = function(mask) {
    this.client.send('MODE', this.getName(), "-b", mask);
};