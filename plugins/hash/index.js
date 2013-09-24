var request = require('request');
var cheerio = require('cheerio');
var crypto = require('crypto');
var HashPlugin = function() {};
HashPlugin.prototype.onCommand = function(server, channel, cmdName, params, user, msg, text) {
    if(cmdName == "md5lookup") {
        if( params.length === 0 ) return user.notice("!md5lookup <hash>");
        var url = "http://md5.noisette.ch/md5.php?hash=" + encodeURIComponent(msg);
        request(url, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var $ = cheerio.load(body, {xmlMode: true});
                if($('error').text().length > 0) {
                    channel.say(user.getNick() + ": " + $('error').text());
                }
                else {
                    channel.say(user.getNick() + ": " + $('string').text());
                }
            }
        });
    }
    else if(cmdName == "hash") {
        if( params.length < 2 ) return user.notice("!hash <md5|sha|sha1|sha256|sha512|rmd160> <string>");

        var method = params[0];
        if(method != "md5" && method != "sha" && method != "sha1" && method != "sha256" && method != "sha512" && method != "rmd160") return user.notice("!hash <md5|sha|sha1|sha256|sha512|rmd160> <string>");

        var sum = crypto.createHash(method);
        sum.update( msg.substr(method.length+1) );
        var res = sum.digest('hex');
        channel.say(user.getNick() + ": " + res );
        return true;
    }
};
HashPlugin.prototype.onHelp = function(server, user, text) {
    user.say("Various hashing algorithms.");
    user.say("Commands: !md5lookup <hash>, !hash <md5|sha|sha1|sha256|sha512|rmd160> <string>");
};
module.exports = new HashPlugin();