var Cleverbot = require('cleverbot-node');
var cb = new Cleverbot();
var Entities = require('html-entities').AllHtmlEntities;
var entities = new Entities();
GLaDOS.register({
    'name': 'cleverbot',
}, function(ircEvent, command) {
    ircEvent('message', function(channel, user, text) {
        if( text.indexOf(GLaDOS.getUser().getNick() + ':') == 0 ) {
            text = text.substr( (GLaDOS.getUser().getNick() + ':').length ).trim();
            cb.write(text, function(response) {
                console.log(response);
                channel.say(user.getNick() + ': ' + entities.decode(response.message));
            });
        }
    });
});