var User = require('./user');

var Channel = module.exports = function (name, connection) {
    this.name = name;
    this.connection = connection;
    this.topic = {};
    this.names = {};
};

Channel.prototype.toString = function () {
    return this.name;
};

Channel.prototype.getName = function () {
    return this.name;
};

Channel.prototype.getTopic = function () {
    return this.topic;
};

Channel.prototype.getNames = function () {
    return this.names; // {'nick': ['~']}
};

User.prototype.getConnection = function () {
    return this.connection;
};

Channel.prototype.userHasMode = function (user, mode) {
    user = typeof user === 'string' ? user : user.getNick();
    if (this.names.hasOwnProperty(user)) {
        return this.names[user].indexOf(mode) > -1;
    }
    return false;
};

Channel.prototype.userHasMinMode = function (user, mode) {
    var userO = typeof user === 'string' ? this.connection.getUser(user) : user;
    if (userO.isOper()) {
        return true;
    }

    switch (mode) {
    case '!':
        return this.userHasMode(user, '!');
    case '~':
        return this.userHasMode(user, '!') ||
            this.userHasMode(user, '~');
    case '&':
        return this.userHasMode(user, '!') ||
            this.userHasMode(user, '~') ||
            this.userHasMode(user, '&');
    case '@':
        return this.userHasMode(user, '!') ||
            this.userHasMode(user, '~') ||
            this.userHasMode(user, '&') ||
            this.userHasMode(user, '@');
    case '%':
        return this.userHasMode(user, '!') ||
            this.userHasMode(user, '~') ||
            this.userHasMode(user, '&') ||
            this.userHasMode(user, '@') ||
            this.userHasMode(user, '%');
    case '+':
        return this.userHasMode(user, '!') ||
            this.userHasMode(user, '~') ||
            this.userHasMode(user, '&') ||
            this.userHasMode(user, '@') ||
            this.userHasMode(user, '%') ||
            this.userHasMode(user, '+');
    default:
        return true;
    }
};

Channel.prototype.isUserInChannel = function (user) {
    user = typeof user === 'string' ? user : user.getNick();
    return this.names.hasOwnProperty(user);
};

Channel.prototype.notice = function () {
    var args = Array.prototype.slice.call(arguments);
    args.unshift(this.getName());
    this.connection.notice.apply(this.connection.notice, args);
    return this;
};

Channel.prototype.say = function () {
    var args = Array.prototype.slice.call(arguments);
    args.unshift(this.getName());
    this.connection.send.apply(this.connection.send, args);
    return this;
};

Channel.prototype.reply = function (user) {
    var args = Array.prototype.slice.call(arguments);
    args.shift();
    user = typeof user === 'string' ? user : user.getNick();
    args.unshift(user + ':');
    args.unshift(this.getName());
    this.connection.send.apply(this.connection.send, args);
    return this;
};

Channel.prototype.kick = function (user, reason) {
    this.connection.kick(this.getName(), user, reason);
    return this;
};

Channel.prototype.ban = function (mask) {
    this.connection.write('MODE ' + this.getName() + ' +b ' + mask);
    return this;
};

Channel.prototype.unban = function (mask) {
    this.connection.write('MODE ' + this.getName() + ' -b ' + mask);
    return this;
};