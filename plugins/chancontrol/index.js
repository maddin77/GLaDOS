var ChannelControlPlugin = function() {};
ChannelControlPlugin.prototype.onCommand = function(server, channel, cmdName, params, user, msg, text) {
    if(cmdName == "kick" || cmdName == "k") {
        if( !channel.userHasMinMode(user.getNick(), "%") ) return user.notice("You don't have the permissions to use this command.");
        if( !channel.userHasMinMode(CONFIG.get('irc:nick'), "%") ) return user.notice("I don't have the permissions to kick someone in this channel.");
        if( params.length === 0 ) return user.notice("!kick <Nick> [Reason]");
        var nick = params[0];
        if(!channel.userExistInChannel(nick)) return user.notice("\"" + nick + "\" doesn't exist.");
        var user_ = server.getUser(nick);
        if( params.length > 1 ) {
            channel.kick(user_.getNick(), "(" + user.getNick() + ") " + msg.slice(user_.getNick().length+1));
        }
        else {
            channel.kick(user_.getNick(), "(" + user.getNick() + ") -");
        }
        return true;
    }
    else if(cmdName == "kickban" || cmdName == "kb") {
        if( !channel.userHasMinMode(user.getNick(), "%") ) return user.notice("You don't have the permissions to use this command.");
        if( !channel.userHasMinMode(CONFIG.get('irc:nick'), "%") ) return user.notice("I don't have the permissions to kick someone in this channel.");
        if( params.length === 0 ) return user.notice("!kickban <Nick> [Reason]");
        var _nick = params[0];
        if(!channel.userExistInChannel(_nick)) return user.notice("\"" + _nick + "\" doesn't exist.");
        var _user = server.getUser(_nick);
        channel.ban("*!*@"+_user.getHost());
        if( params.length > 1 ) {
            channel.kick(_user.getNick(), "(" + user.getNick() + ") " + msg.slice(_user.getNick().length+1));
        }
        else {
            channel.kick(_user.getNick(), "(" + user.getNick() + ") -");
        }
        return true;
    }
};
ChannelControlPlugin.prototype.onHelp = function(server, user, text) {
    user.say("Provides a lot of functions for controlling a channel.");
    user.say("Commands: !kick <Nick> [Reason], !k <Nick> [Reason], !kickban <Nick> [Reason], ", "!kb <Nick> [Reason]");
};
module.exports = new ChannelControlPlugin();