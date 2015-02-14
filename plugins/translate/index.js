var request = require('request');
var TranslatePlugin = function() {};
TranslatePlugin.prototype.onCommand = function(server, channel, cmdName, params, user, msg, text) {
    if(cmdName == "translate" || cmdName == "t") {
        if(params.length < 1) return user.notice("!translate <source language> <target language> <sentence>");
        var source = params[0];
        var target = params[1];
        var sentence = msg.substring(source.length + 1 + target.length + 1);
        request('http://api.mymemory.translated.net/get?q=' + encodeURIComponent(sentence) + '&langpair=' + source + '|' + target, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var resp = JSON.parse(body);
                if(resp.responseStatus == "200") {
                    channel.say(user.getNick() + ': ' + resp.responseData.translatedText);
                }
                else {
                    channel.say(user.getNick() + ': ' + resp.responseDetails);
                }
            }
        });
    }
};
TranslatePlugin.prototype.onHelp = function(server, user, text) {
    user.say("Translate sentences from one langauge to another.");
    user.say("Commands: !translate <sentence>, !t <sentence>");
};
module.exports = new TranslatePlugin();