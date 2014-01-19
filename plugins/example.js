GLaDOS.register({
    'name': 'Example',
    'desc': 'Example plugin does nothing',
    'commands': '!example - nothing'
    //-or-
    'commands': [
        '!example - nothing',
        '!secondexample - still nothing'
    ]
},function(ircEvent, command) {
    //events.on('registered', function() {});
    //events.on('motd', function(motd) {});
    //events.on('names', function(channel, nicks) {});
    //events.on('join', function(channel, user) {});
    //events.on('part', function(channel, user, reason) {});
    //events.on('quit', function(user, channels, reason) {});
    //events.on('kick', function(channel, user, by, reason) {});
    //events.on('kill', function(user, channels, reason) {});
    //events.on('pm', function(user, text) {});
    //events.on('message', function(channel, user, text) {});
    //events.on('notice', function(user, to, text) {});
    //events.on('action', function(user, to, text) {});
    //events.on('ping', function() {});
    //events.on('ctcp', function(from, to, text, type) {});
    //events.on('nick', function(channels, user, oldnick, newnick) {});
    //events.on('invite', function(channel, user) {});
    //events.on('mode', function(channel, user, add, mode, argument) {});
});