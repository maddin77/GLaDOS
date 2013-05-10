module.exports = {
    /*==========[ +INFO+ ]==========*/
    info: {
        description: "Postet Informationen von Wolfram Alpha im Channel.",
        commands: ["{C}wolfram <Term>", "{C}wa <Term>"]
    },
    /*==========[ -INFO- ]==========*/

    qs: require('querystring'),
    wolfram: function(query, callback) {
        var uri = 'http://api.wolframalpha.com/v2/query?' + this.qs.stringify({
            'input': query,
            'primary': "true",
            'appid': 'WW6R5P-6QEKU3E6UX'
        });
        REQUEST(uri, function (error, response, body) {
            if(!error && response.statusCode == 200) {
                var $ = CHEERIO.load(body, {xmlMode: true});
                //console.log(body);
                if( $('queryresult').attr('error') !== 'false' ) {
                    require('fs').writeFile('wolfram-error.log', body);
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
                            if(UTIL.startsWith(key, "Local currency conversion")) {
                                return callback(null, _return['Input interpretation'] + ": " + _return[key].split("\n")[0]);
                            }
                            else if(UTIL.startsWith(key, "Definitions of ")) {
                                return callback(null, _return['Input interpretation'] + ": " + _return[key].split("\n").join(", "));
                            }
                        }
                        var fs = require('fs');
                        fs.appendFile('wolfram.json', '//'+query + "\n" + JSON.stringify(_return, null, 4) + "\n");
                        return callback("no matching result", null);
                    }
                }
            } else {
                return callback(error, null);
            }
        });
    },

    onCommand: function(client, server, channel, commandChar, name, params, user, text, message) {
        if(name == "wolfram" || name == "wa") {
            if( params.length === 0 ) return client.notice(user.getNick(), commandChar + name + " <Term>");
            this.wolfram(text, function(err, result) {
                if(err) {
                    client.say(channel.getName(), "Error: " + err);
                }
                else {
                    client.say(channel.getName(), user.getNick() + ": " + result);
                }
            });
        }
    }
};