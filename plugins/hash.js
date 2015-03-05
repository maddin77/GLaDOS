var crypto  = require('crypto');
var request = require('request');
var cheerio = require('cheerio');

exports.register = function (glados, next) {

    glados.hear(/^!md5( .+)?$/i, function (match, event) {
        var text = match[1] ? match[1].trim() : null;
        if (!text) {
            return event.user.notice('Benutze: !md5 <Text>');
        }
        event.channel.reply(event.user, crypto.createHash('md5').update(text).digest('hex'));
    });
    glados.hear(/^!sha( .+)?$/i, function (match, event) {
        var text = match[1] ? match[1].trim() : null;
        if (!text) {
            return event.user.notice('Benutze: !sha <Text>');
        }
        event.channel.reply(event.user, crypto.createHash('sha').update(text).digest('hex'));
    });
    glados.hear(/^!sha1( .+)?$/i, function (match, event) {
        var text = match[1] ? match[1].trim() : null;
        if (!text) {
            return event.user.notice('Benutze: !sha <Text>');
        }
        event.channel.reply(event.user, crypto.createHash('sha1').update(text).digest('hex'));
    });
    glados.hear(/^!sha256( .+)?$/i, function (match, event) {
        var text = match[1] ? match[1].trim() : null;
        if (!text) {
            return event.user.notice('Benutze: !sha256 <Text>');
        }
        event.channel.reply(event.user, crypto.createHash('sha256').update(text).digest('hex'));
    });
    glados.hear(/^!sha512( .+)?$/i, function (match, event) {
        var text = match[1] ? match[1].trim() : null;
        if (!text) {
            return event.user.notice('Benutze: !sha512 <Text>');
        }
        event.channel.reply(event.user, crypto.createHash('sha512').update(text).digest('hex'));
    });
    glados.hear(/^!rmd160( .+)?$/i, function (match, event) {
        var text = match[1] ? match[1].trim() : null;
        if (!text) {
            return event.user.notice('Benutze: !rmd160 <Text>');
        }
        event.channel.reply(event.user, crypto.createHash('rmd160').update(text).digest('hex'));
    });
    glados.hear(/^!md5lookup( .+)?$/i, function (match, event) {
        var text = match[1] ? match[1].trim() : null;
        if (!text) {
            return event.user.notice('Benutze: !md5lookup <MD5 Hash>');
        }
        request('http://hashtoolkit.com/reverse-hash?hash=' + text, function (error, response, body) {
            if (error) {
                glados.debug('[getCoinData] %s', error);
                return event.channel.reply(event.user, 'Gratz. You broke it. (' + error + ')');
            }
            var $ = cheerio.load(body);
            error = $('.alert').text().trim();
            if (error.length > 0) {
                return event.channel.reply(event.user, error);
            }
            var result = $('.res-text span').first().text().trim();
            return event.channel.reply(event.user, text + ' = ' + result);
        });
    });
    return next();
};
exports.info = {
    name: 'hash',
    displayName: 'Hash',
    desc: ['Verschiedene Hashfunktionen.'],
    version: '1.0.0',
    commands: [{
        name: 'md5',
        params: {
            'Text': 'required'
        },
        desc: ['Gibt den MD5 Hash des angegebenen Textes zurück.']
    },{
        name: 'sha',
        params: {
            'Text': 'required'
        },
        desc: ['Gibt den SHA Hash des angegebenen Textes zurück.']
    },{
        name: 'sha1',
        params: {
            'Text': 'required'
        },
        desc: ['Gibt den SHA-1 Hash des angegebenen Textes zurück.']
    },{
        name: 'sha256',
        params: {
            'Text': 'required'
        },
        desc: ['Gibt den SHA-256 Hash des angegebenen Textes zurück.']
    },{
        name: 'sha512',
        params: {
            'Text': 'required'
        },
        desc: ['Gibt den SHA-512 Hash des angegebenen Textes zurück.']
    },{
        name: 'rmd160',
        params: {
            'Text': 'required'
        },
        desc: ['Gibt den RMD160 Hash des angegebenen Textes zurück.']
    },{
        name: 'md5lookup',
        params: {
            'Hash': 'required'
        },
        desc: ['Sucht nach dem angegebenen Hash in einer Onlinedatenbank und gibt das Ergebniss zurück.']
    }]
};