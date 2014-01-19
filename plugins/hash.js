var request = require('request');
var cheerio = require('cheerio');
var crypto = require('crypto');
GLaDOS.register({
    'name': 'hash',
    'desc': 'various hashing algorithms.',
    'commands': [
        '!md5 <string>',
        '!sha <string>',
        '!sha1 <string>',
        '!sha256 <string>',
        '!sha512 <string>',
        '!rmd160 <string>',
        '!md5lookup <md5 hash> - reverse MD5 lookup in multiple databases.'
    ]
},function(ircEvent, command) {
    command('md5', function(channel, user, name, text, params) {
        if( params.length === 0 ) return user.notice('!md5 <string>');
        var sum = crypto.createHash('md5');
        sum.update( text );
        channel.say(user.getNick() + ": " + sum.digest('hex') );
    });
    command('sha', function(channel, user, name, text, params) {
        if( params.length === 0 ) return user.notice('!sha <string>');
        var sum = crypto.createHash('sha');
        sum.update( text );
        channel.say(user.getNick() + ": " + sum.digest('hex') );
    });
    command('sha1', function(channel, user, name, text, params) {
        if( params.length === 0 ) return user.notice('!sha1 <string>');
        var sum = crypto.createHash('sha1');
        sum.update( text );
        channel.say(user.getNick() + ": " + sum.digest('hex') );
    });
    command('sha256', function(channel, user, name, text, params) {
        if( params.length === 0 ) return user.notice('!sha256 <string>');
        var sum = crypto.createHash('sha256');
        sum.update( text );
        channel.say(user.getNick() + ": " + sum.digest('hex') );
    });
    command('sha512', function(channel, user, name, text, params) {
        if( params.length === 0 ) return user.notice('!sha512 <string>');
        var sum = crypto.createHash('sha512');
        sum.update( text );
        channel.say(user.getNick() + ": " + sum.digest('hex') );
    });
    command('rmd160', function(channel, user, name, text, params) {
        if( params.length === 0 ) return user.notice('!rmd160 <string>');
        var sum = crypto.createHash('rmd160');
        sum.update( text );
        channel.say(user.getNick() + ": " + sum.digest('hex') );
    });
    command('md5lookup', function(channel, user, name, text, params) {
        if( params.length === 0 ) return user.notice('!md5lookup <md5 hash>');
        var url = "http://md5.noisette.ch/md5.php?hash=" + encodeURIComponent(text);
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
    });
});