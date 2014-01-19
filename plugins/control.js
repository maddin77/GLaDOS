GLaDOS.register({
    'name': 'Control',
    'desc': 'Provides functions to control the Bot.',
    'commands': [
        '!exit',
        '!join <channel>',
        '!part [channel]',
        '!memory',
        '!raw <raw line>',
        '!ping'
    ]
}, function(ircEvent, command) {
    command('exit', function(channel, user, name, text, params) {
        if(!user.hasPermissions()) return user.notice('You don\'t have the permissions to use this command.');
        GLaDOS.shutdown();
    });
    command('join', function(channel, user, name, text, params) {
        if(!user.hasPermissions()) return user.notice('You don\'t have the permissions to use this command.');
        if(params.length < 1) return user.notice('!join <Channel>');
        var chans = GLaDOS.config.get('irc:channels');
        if( chans.indexOf(params[0]) > -1 ) {
            return user.notice('I\'m already in this channel.');
        }
        GLaDOS.getChannel(params[0]).join();
        chans.push(params[0]);
        GLaDOS.config.set('irc:channels', chans);
        GLaDOS.config.save();
    });
    command('part', function(channel, user, name, text, params) {
        if(!user.hasPermissions()) return user.notice('You don\'t have the permissions to use this command.');
        var chan = params.length < 1 ? channel.getName() : params[0];
        var chans = GLaDOS.config.get('irc:channels');
        var index = chans.indexOf(chan);
        if( index == -1 ) {
            return user.notice('I\'m not in this channel.');
        }
        GLaDOS.getChannel(chan).part();
        chans.splice(index, 1);
        GLaDOS.config.set('irc:channels', chans);
        GLaDOS.config.save();
    });
    command(['mem','memory'], function(channel, user, name, text, params) {
        if(!user.hasPermissions()) return user.notice('You don\'t have the permissions to use this command.');
        var mem = process.memoryUsage();
        user.notice(readableNumber(mem.rss) + " (v8: " + readableNumber(mem.heapUsed) + " / " + readableNumber(mem.heapTotal) + ")");
        return true;
    });
    command('raw', function(channel, user, name, text, params) {
        if(!user.hasPermissions()) return user.notice('You don\'t have the permissions to use this command.');
        GLaDOS.sendRaw(text);
    });
    ircEvent('pm', function(user, text) {
        var params = text.split(' ');
        if(params.length === 2 && params[0] === 'identify') {
            GLaDOS.sendMessage('NickServ', 'IDENTIFY ' + params[1]);
            GLaDOS.config.set('irc:password', params[1]);
            GLaDOS.config.save();
        }
    });
});
function readableNumber(bytes) {
    var s = ['bytes', 'kB', 'MB', 'GB', 'TB', 'PB'];
    var e = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, e)).toFixed(2) + " " + s[e];
}