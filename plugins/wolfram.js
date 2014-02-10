var request = require('request');
var querystring = require('querystring');
var cheerio = require('cheerio');
var fs = require('fs');
GLaDOS.register({
    'name': 'wolfram',
    'description': 'Use Wolfram Alpha to do stuff.',
    'commands': [
        '!wolfram <query>',
        '!wa <query>'
    ]
},function (ircEvent, command) {
    command(['wolfram','wa'], function (channel, user, name, text, params) {
        if( params.length === 0 ) return user.notice('!wolfram <query>');
        wolfram(text, function (error, result) {
            if (!error) {
                channel.say(user.getNick() + ': ' + result);
            }
            else {
                GLaDOS.logger.error('[wolfram] %s', (error||'Unknown Error'), error);
                channel.say(user.getNick() + ': ' + (error.getMessage()||'Unknown Error'));
            }
        });
    });
});

function wolfram(query, cb) {
    var uri = 'http://api.wolframalpha.com/v2/query?' + querystring.stringify({
        "input": query,
        "units": 'metric',
        "format": "plaintext",
        "primary": true,
        "appid": GLaDOS.config.get('wolframAlphaKey')
    });
    request(uri, function (error, response, body) {
        if (error || response.statusCode !== 200) {
            return cb(error, null);
        } else {
            var $ = cheerio.load(body, {xmlMode: true});
            if( $('queryresult').attr('error') !== 'false' ) {
                fs.writeFile('wolfram-error.log', body);
                return cb("look @ \"wolfram-error.log\"", null);
            } else {
                var _return = {};
                var pod = $('pod').each(function(i) {
                    var title = $(this).attr('title');
                    var subpods = $(this).find('subpod');
                    _return[ title ] = null;
                    if( subpods.length > 1 ) {
                        _return[ title ] = [];
                        subpods.each(function(j) {
                            _return[ title ].push( $(this).find('plaintext').text() );
                        });
                    }
                    else {
                        _return[ title ] = $(this).find('plaintext').text();
                    }
                });
                if(_return.hasOwnProperty('Result')) {
                    var _ret = _return['Result'];
                    if(_return.hasOwnProperty('Unit conversions')) {
                        _ret += " (" + _return['Unit conversions'].join(", ") + ")";
                    }
                    return cb(null, _ret);
                }
                else if(_return.hasOwnProperty('Response')) return cb(null, _return['Response']);
                else if(_return.hasOwnProperty('Definition')) return cb(null, _return['Definition']);
                else if(_return.hasOwnProperty('Definitions')) return cb(null, _return['Definitions'].split('\n').join(', '));
                else if(_return.hasOwnProperty('Unit conversions')) return cb(null, _return['Unit conversions'].join(', '));
                else if(_return.hasOwnProperty('Results')) return cb(null, _return['Results'].join(', '));
                else if(_return.hasOwnProperty('Population')) return cb(null, _return['Input interpretation'] + ": " + _return['Population']);
                else if(_return.hasOwnProperty('Capital city')) return cb(null, _return['Name'].split(' | ').join(': ').split('\n').join(', ') + ", Capital city: " + _return['Capital city']);
                else if(_return.hasOwnProperty('Basic properties')) return cb(null, _return['Input interpretation'] + ": " + _return['Basic properties'].split(' | ').join(': ').split('\n').join(', '));
                else if(_return.hasOwnProperty('Encodings')) return cb(null, _return['Input interpretation'] + ": " + _return['Encodings'].split(' | ').join(': ').split('\n').join(', '));
                else {
                    for(var key in _return) {
                        if(key.lastIndexOf("Local currency conversion", 0) === 0) {
                            return cb(null, _return['Input interpretation'] + ": " + _return[key].split("\n")[0]);
                        }
                        else if(key.lastIndexOf("Definitions of ", 0) === 0) {
                            return cb(null, _return['Input interpretation'] + ": " + _return[key].split("\n").join(", "));
                        }
                    }
                    GLaDOS.logger.error('[wolfram] No matching results fro %s', query, _return);
                    return cb("no matching result", null);
                }
            }
        }
    });
}