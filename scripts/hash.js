//var request = require('request');
//var cheerio = require('cheerio');
var crypto  = require('crypto');
//var util    = require('util');

module.exports = function (scriptLoader) {
    scriptLoader.on('command', 'md5', function (event) {
        if (event.params.length > 0) {
            var sum = crypto.createHash('md5');
            sum.update(event.text, 'utf8');
            event.channel.reply(event.user, sum.digest('hex'));
        } else {
            event.user.notice('Use: !md5 <string>');
        }
    });
    scriptLoader.on('command', 'sha', function (event) {
        if (event.params.length > 0) {
            var sum = crypto.createHash('sha');
            sum.update(event.text, 'utf8');
            event.channel.reply(event.user, sum.digest('hex'));
        } else {
            event.user.notice('Use: !sha <string>');
        }
    });
    scriptLoader.on('command', 'sha1', function (event) {
        if (event.params.length > 0) {
            var sum = crypto.createHash('sha1');
            sum.update(event.text, 'utf8');
            event.channel.reply(event.user, sum.digest('hex'));
        } else {
            event.user.notice('Use: !sha1 <string>');
        }
    });
    scriptLoader.on('command', 'sha256', function (event) {
        if (event.params.length > 0) {
            var sum = crypto.createHash('sha256');
            sum.update(event.text, 'utf8');
            event.channel.reply(event.user, sum.digest('hex'));
        } else {
            event.user.notice('Use: !sha256 <string>');
        }
    });
    scriptLoader.on('command', 'sha512', function (event) {
        if (event.params.length > 0) {
            var sum = crypto.createHash('sha512');
            sum.update(event.text, 'utf8');
            event.channel.reply(event.user, sum.digest('hex'));
        } else {
            event.user.notice('Use: !sha512 <string>');
        }
    });
    scriptLoader.on('command', 'rmd160', function (event) {
        if (event.params.length > 0) {
            var sum = crypto.createHash('rmd160');
            sum.update(event.text, 'utf8');
            event.channel.reply(event.user, sum.digest('hex'));
        } else {
            event.user.notice('Use: !rmd160 <string>');
        }
    });
    /*
    API is kill :(
    scriptLoader.on('command', 'md5lookup', function (event) {
        if (event.params.length > 0) {
            request({
                "uri": 'http://md5hashing.net/search/md5/' + encodeURIComponent(event.text),
                "headers": {
                    "User-Agent": scriptLoader.connection.config.userAgent
                }
            }, function (error, response, body) {
                if (!error) {
                    var $ = cheerio.load(body);
                    event.channel.reply(event.user, $('title').text());
                } else {
                    event.channel.reply(event.user, 'Gratz. You broke it. (' + error + ')');
                    scriptLoader.debug('%s', error);
                }
            });
        } else {
            event.user.notice('Use: !md5lookup <md5 hash>');
        }
    });
    */
};