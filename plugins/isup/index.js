var request = require('request');
var cheerio = require('cheerio');
var IsupPlugin = function() {};
IsupPlugin.prototype.onCommand = function(server, channel, cmdName, params, user, msg, text) {
    if(cmdName == "isup") {
        if( params.length === 0 ) return user.notice("!isup <url>");
        request('http://www.isup.me/' + msg, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var $ = cheerio.load(body);
                $('#container p, #container br, #container center, .ad-container').remove();
                var result = $('#container').text().replace(/(?:(?:^|\n)\s+|\s+(?:$|\n))/g,'').replace(/\s+/g,' ');
                channel.say(user.getNick() + ": " + result);
            }
        });
        return true;
    }
};
IsupPlugin.prototype.onHelp = function(server, user, text) {
    user.say("Check the availability of a website.");
    user.say("Commands: !isup <url>");
};
module.exports = new IsupPlugin();