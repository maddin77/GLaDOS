var math = require('mathjs')();
var MathPlugin = function() {};
MathPlugin.prototype.onCommand = function(server, channel, cmdName, params, user, msg, text) {
    if(cmdName == "math" || cmdName == "c" || cmdName == "calc" || cmdName == "calculate") {
        if(params.length < 1) return user.notice("!math <expression>");
        try {
            channel.say(user.getNick() + ": " + math.eval(msg));
        }
        catch(e) {
            channel.say(user.getNick() + ": " + e);
        }
    }
};
MathPlugin.prototype.onHelp = function(server, user, text) {
    user.say("Analyze mathematical expressions and calculate results.");
    user.say("Commands: !math <expression>, !calculate <expression>, !calc <expression>, !c <expression>");
};
module.exports = new MathPlugin();