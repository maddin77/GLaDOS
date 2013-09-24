var querystring = require('querystring');
var request = require('request');
var cheerio = require('cheerio');
var fs = require('fs');
var WolframPlugin = function() {};
WolframPlugin.prototype.onCommand = function(server, channel, cmdName, params, user, msg, text) {
    if(cmdName == "wa" || cmdName == "wolfram") {
        if(params.length < 1) return user.notice("!wolfram <Term>");
        this.wolfram(msg, function(err, result) {
            if(err) {
                channel.say();
                channel.say(user.getNick() + ': Error (' + err + ')');
            }
            else {
                channel.say(user.getNick() + ': ' + result);
            }
        });
    }
};
WolframPlugin.prototype.wolfram = function(query, callback) {
    var uri = 'http://api.wolframalpha.com/v2/query?' + querystring.stringify({
        'input': query,
        'primary': "true",
        'appid': this.cfg.get('wolframAlpha')
    });
    request(uri, function (error, response, body) {
        if(!error && response.statusCode == 200) {
            var $ = cheerio.load(body, {xmlMode: true});
            //console.log(body);
            if( $('queryresult').attr('error') !== 'false' ) {
                fs.writeFile('wolfram-error.log', body);
                return callback("look @ \"wolfram-error.log\"", null);
            }
            else {
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
                    return callback(null, _ret);
                }
                else if(_return.hasOwnProperty('Response')) return callback(null, _return['Response']);
                else if(_return.hasOwnProperty('Definition')) return callback(null, _return['Definition']);
                else if(_return.hasOwnProperty('Definitions')) return callback(null, _return['Definitions'].split('\n').join(', '));
                else if(_return.hasOwnProperty('Unit conversions')) return callback(null, _return['Unit conversions'].join(', '));
                else if(_return.hasOwnProperty('Results')) return callback(null, _return['Results'].join(', '));
                else if(_return.hasOwnProperty('Population')) return callback(null, _return['Input interpretation'] + ": " + _return['Population']);
                else if(_return.hasOwnProperty('Capital city')) return callback(null, _return['Name'].split(' | ').join(': ').split('\n').join(', ') + ", Capital city: " + _return['Capital city']);
                else if(_return.hasOwnProperty('Basic properties')) return callback(null, _return['Input interpretation'] + ": " + _return['Basic properties'].split(' | ').join(': ').split('\n').join(', '));
                else if(_return.hasOwnProperty('Encodings')) return callback(null, _return['Input interpretation'] + ": " + _return['Encodings'].split(' | ').join(': ').split('\n').join(', '));
                else {
                    for(var key in _return) {
                        if(key.lastIndexOf("Local currency conversion", 0) === 0) {
                            return callback(null, _return['Input interpretation'] + ": " + _return[key].split("\n")[0]);
                        }
                        else if(key.lastIndexOf("Definitions of ", 0) === 0) {
                            return callback(null, _return['Input interpretation'] + ": " + _return[key].split("\n").join(", "));
                        }
                    }
                    fs.appendFile('wolfram.json', '//'+query + "\n" + JSON.stringify(_return, null, 4) + "\n");
                    return callback("no matching result", null);
                }
            }
        } else {
            return callback(error, null);
        }
    });
};
WolframPlugin.prototype.onHelp = function(server, user, text) {
    user.say("Use Wolfram Alpha to do stuff.");
    user.say("Commands: !wolfram <term>, !wa <term>");
};
module.exports = new WolframPlugin();