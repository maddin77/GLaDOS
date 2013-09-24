var request = require("request");
var cheerio = require("cheerio");
var WikiPlugin = function() {};
WikiPlugin.prototype.getArticle = function(page, callback) {
    var that = this;
    request('http://en.wikipedia.org/wiki/Special:Search?search='+encodeURIComponent(page), function(error, response, body) {
        if (!error && response.statusCode == 200) {
            if( /There were no results matching the query/.test(body) ) {
                callback("Wikipedia has no idea what you're talking about.");
            }
            if( /may refer to:/.test(body) ) {
                callback("Have a look for yourself: " + response.request.href );
            }
            else {
                $ = cheerio.load(body, {
                    ignoreWhitespace: true
                });
                var text = $('#content #bodyContent #mw-content-text p').first().text();
                text = text.replace(/\s*\([^()]*?\)/g, '').replace(/\s*\([^()]*?\)/g, '');
                text = text.replace(/\s{2,}/g, ' ');
                text = text.replace(/\[[\d\s]+\]/g, '');
                callback(text, response.request.href);
            }
        }
        else {
            callback("Sorry, the tubes are broken.");
        }
    });
};
WikiPlugin.prototype.onCommand = function(server, channel, cmdName, params, user, msg, text) {
    if(cmdName == "wiki") {
        if(params.length < 1) return user.notice("!wiki <query>");
        this.getArticle(msg, function(text, url) {
            if(text.length > 400) {
                channel.say(user.getNick() + ': ' + text.substring(0, 397) + '...');
                channel.say(user.getNick() + ': See ' + url + ' for more information.');
            }
            else {
                channel.say(user.getNick() + ': ' + text);
            }
        });
    }
};
module.exports = new WikiPlugin();