var cheerio = require('cheerio');
var request = require('request');
var UrbanDictionaryPlugin = function() {};
UrbanDictionaryPlugin.prototype.onCommand = function(server, channel, cmdName, params, user, msg, text) {
    if(cmdName == "ud" || cmdName == "urban") {
        if( params.length === 0 ) return user.notice("!urban <term>");
        this.urban(msg, function(found, entry) {
            if(!found) {
                channel.say('"'+msg + '" not found');
            }
            else {
                channel.say(msg + ': ' + entry.definition);
                channel.say('Example: ' + entry.example);
            }
        });
    }
};
UrbanDictionaryPlugin.prototype.urban = function(term, callback) {
    request('http://api.urbandictionary.com/v0/define?term='+encodeURIComponent(term), function (error, response, body) {
        var result = JSON.parse(body);
        if( result.list.length ) {
            callback(true, result.list[0]);
        }
        else {
            callback(false);
        }
    });
};
UrbanDictionaryPlugin.prototype.onHelp = function(server, user, text) {
    user.say("Define terms via Urban Dictionary");
    user.say("Commands: !urban <term>, !ud <term>");
};
module.exports = new UrbanDictionaryPlugin();