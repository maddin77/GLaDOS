var request = require('request');
var util = require('util');
GLaDOS.register({
    'name': 'urbandictionary',
    'description': 'Define terms via Urban Dictionary.',
    'commands': '!urban <term>'
},function(ircEvent, command) {
    command(['urban','ud'], function(channel, user, name, text, params) {
        if( params.length === 0 ) return user.notice('!urban <term>');
        request({
            uri: 'http://api.urbandictionary.com/v0/define?term='+encodeURIComponent(text),
            json: true
        }, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                if( body.list.length === 0 ) {
                    channel.say(user.getNick() + ': No results found for "' + text + '".');
                }
                else {
                    var entry = body.list[0];
                    channel.say(entry.word + ': ' + entry.definition);
                    channel.say('Example: ' + entry.example);
                }
            }
            else {
                GLaDOS.logger.error('[urbandictionary] %s', (error||'Unknown Error'), error);
                channel.say(user.getNick() + ': ' + (error||'Unknown Error'));
            }
        });
    });
});