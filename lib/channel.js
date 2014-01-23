var Channel = module.exports = function(name, server) {
    this.name = name;
    this.client = server.client;
    this.server = server;
    this.logger = server.logger;
    this.userCount = 0;
    this.topic = {
        "nick": null,
        "topic": null,
        "time": null
    };
    this.modes = [];
    this.userModes = {};
    this.nickList = [];
};
Channel.prototype.getName = function() {
    return this.name;
};
Channel.prototype.addNick = function(nick) {
    if(!this.userExistInChannel(nick)) {
        this.nickList.push(nick);
    }
};
Channel.prototype.remNick = function(nick) {
    var index = this.nickList.indexOf(nick);
    if(index != -1) {
        this.nickList.splice(index, 1);
    }
};
Channel.prototype.getNickList = function() {
    return this.nickList;
};
Channel.prototype.setTopic = function(topic) {
    this.topic = topic;
};
Channel.prototype.getTopic = function() {
    return this.topic;
};
Channel.prototype.userExistInChannel = function(nick) {
    return this.nickList.indexOf(nick) != -1;
};
Channel.prototype.addUserMode = function(nick, mode) {
    mode = this.getRightMode(mode);
    if(!this.userHasMode(nick, mode)) {
        this.userModes[nick].push(mode);
    }
};
Channel.prototype.remUserMode = function(nick, mode) {
    mode = this.getRightMode(mode);
    if(this.userHasMode(nick, mode)) {
       var index = this.userModes[nick].indexOf(mode);
       if(index !== -1) {
            this.userModes[nick].splice(index,1);
       }
    }
};
Channel.prototype.userHasMode = function(nick, mode) {
    mode = this.getRightMode(mode);
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
    mode = this.getRightMode(mode);
    switch(mode) {
        case "q": return this.userHasMode(nick, "q");
        case "a": return this.userHasMode(nick, "q") || this.userHasMode(nick, "a");
        case "o": return this.userHasMode(nick, "q") || this.userHasMode(nick, "a") || this.userHasMode(nick, "o");
        case "h": return this.userHasMode(nick, "q") || this.userHasMode(nick, "a") || this.userHasMode(nick, "o") || this.userHasMode(nick, "h");
        case "v": return this.userHasMode(nick, "q") || this.userHasMode(nick, "a") || this.userHasMode(nick, "o") || this.userHasMode(nick, "h") || this.userHasMode(nick, "v");
        default: return false;
    }
};
Channel.prototype.getRightMode = function(mode) {
    switch(mode) {
        case "~": return 'q';
        case "&": return 'a';
        case "@": return 'o';
        case "%": return 'h';
        case "+": return 'v';
        default: return mode;
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
    this.logger.info('[%s] %s: %s', this.getName(), this.client.nick, msg);
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
Channel.prototype.join = function() {
    this.client.join(this.getName());
};
Channel.prototype.part = function() {
    this.client.part(this.getName());
};