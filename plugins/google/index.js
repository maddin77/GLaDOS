var google = require('google');
var GooglePlugin = function() {};
GooglePlugin.prototype.onCommand = function(server, channel, cmdName, params, user, msg, text) {
    if(cmdName == "google" || cmdName == "g") {
        if( params.length === 0 ) return user.notice("!google <Query>");
        google(msg, function(err, next, links) {
            if(links.length > 0) {
                channel.say(user.getNick() + ": " + links[0].title + " (" + links[0].link + ")" );
            }
            else {
                channel.say(user.getNick() + ": Your search - " + msg + " - did not match any documents.");
            }
        });
    }
};
GooglePlugin.prototype.onHelp = function(server, user, text) {
    user.say("Returns the URL of the first google hit for a query.");
    user.say("Commands: !g <Query>, !google <Query>");
};
module.exports = new GooglePlugin();