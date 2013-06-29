module.exports = {
    /*==========[ +INFO+ ]==========*/
    info: {
        description: "Provides a lot of functions for controlling a channel.",
        commands: ["{C}kick <Nick> [Reason]", "{C}k <Nick> [Reason]", "{C}kickban <Nick> [Reason]", "{C}kb <Nick> [Reason]"]
    },
    /*==========[ -INFO- ]==========*/

    onCommand: function(client, server, channel, commandChar, name, params, user, text, message) {
        if(name == "kick" || name == "k") {
            if( !channel.userHasMinMode(user.getNick(), "%") ) return client.notice(user.getNick(), "You don't have the permissions to use this command.");
            if( !channel.userHasMinMode(CONFIG.get('irc:nick'), "%") ) return client.notice(user.getNick(), "I don't have the permissions to kick someone in this channel.");
            if( params.length === 0 ) return client.notice(user.getNick(), commandChar + name + " <Nick> [Reason]");
            var nick = params[0];
            if(!channel.userExistInChannel(nick)) return client.notice(user.getNick(), "\"" + nick + "\" doesn't exist.");
            var user_ = server.getUser(nick);
            if( params.length > 1 ) {
                client.send('KICK', channel.getName(), user_.getNick(), "(" + user.getNick() + ") " + text.slice(user_.getNick().length+1));
            }
            else {
                client.send('KICK', channel.getName(), user_.getNick(), "(" + user.getNick() + ") -");
            }
            return true;
        }
        else if(name == "kickban" || name == "kb") {
            if( !channel.userHasMinMode(user.getNick(), "%") ) return client.notice(user.getNick(), "You don't have the permissions to use this command.");
            if( !channel.userHasMinMode(CONFIG.get('irc:nick'), "%") ) return client.notice(user.getNick(), "I don't have the permissions to kick someone in this channel.");
            if( params.length === 0 ) return client.notice(user.getNick(), commandChar + name + " <Nick> [Reason]");
            var _nick = params[0];
            if(!channel.userExistInChannel(_nick)) return client.notice(user.getNick(), "\"" + _nick + "\" doesn't exist.");
            var _user = server.getUser(_nick);
            client.send('MODE', channel.getName(), "+b", "*!*@"+_user.getHost());
            if( params.length > 1 ) {
                client.send('KICK', channel.getName(), _user.getNick(), "(" + user.getNick() + ") " + text.slice(_user.getNick().length+1));
            }
            else {
                client.send('KICK', channel.getName(), _user.getNick(), "(" + user.getNick() + ") -");
            }
            return true;
        }
    }
};