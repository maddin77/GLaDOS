module.exports = {
    /*==========[ +INFO+ ]==========*/
    info: {
        description: "Kickt einen Nutzer aus dem Channel und Bannt ihn. Optional auch mit Grund. Kann nur von Operatoren benutzt werden.",
        commands: ["{C}kickban <Nick> [Grund]", "{C}kb <Nick> [Grund]"]
    },
    /*==========[ -INFO- ]==========*/

    onCommand: function(client, server, channel, commandChar, name, params, user, text, message) {
        if(name == "kickban" || name == "kb") {
            if( !channel.userHasMinMode(user.getNick(), "%") ) return client.notice(user.getNick(), "Du hast nicht die nötigen rechte dazu.");
            if( !channel.userHasMinMode(CONFIG.get('irc:nick'), "%") ) return client.notice(user.getNick(), "Ich habe nicht die nötigen rechte dazu.");
            if( params.length === 0 ) return client.notice(user.getNick(), commandChar + name + " <Nick> [Grund]");
            var _nick = params[0];
            if(!channel.userExistInChannel(_nick)) return client.notice(user.getNick(), "\"" + _nick + "\" existiert nicht.");
            var _user = server.getUser(_nick);
            var reason = "";
            if( params.length > 1 ) {
                reason = text.slice(_user.getNick().length+1);
            }
            else {
                reason = "-";
            }
            client.send('MODE', channel.getName(), "+b", "*!*@"+_user.getHost());
            client.send('KICK', channel.getName(), _user.getNick(), "(" + user.getNick() + ") " + reason);
            return true;
        }
    }
};