var morse = require('morse');
var MorsePlugin = function() {};
MorsePlugin.prototype.onCommand = function(server, channel, cmdName, params, user, msg, text) {
    if(cmdName == "morse") {
        if(params.length < 1) return user.notice("!morse <string>");
        channel.say(user.getNick() + ": " + morse.encode(msg));
    }
};
MorsePlugin.prototype.onHelp = function(server, user, text) {
    user.say("Converts a String to Morse code.");
    user.say("Commands: !morse <string>");
};
module.exports = new MorsePlugin();