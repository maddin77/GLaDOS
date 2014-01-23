var __ = require('underscore')._;
var phrases = ["Yes, master?", "At your service", "Unleash my strength", "I'm here. As always", "By your command", "Ready to work!", "Yes, milord?", "More work?", "Ready for action", "Orders?", "What do you need?", "Say the word", "Aye, my lord", "Locked and loaded", "Aye, sir?", "I await your command", "Your honor?", "Command me!", "At once", "What ails you?", "Yes, my firend?", "Is my aid required?", "Do you require my aid?", "My powers are ready", "It's hammer time!", "I'm your robot", "I'm on the job", "You're interrupting my calculations!", "What is your wish?", "How may I serve?", "At your call", "You require my assistance?", "What is it now?", "Hmm?", "I'm coming through!", "I'm here, mortal", "I'm ready and waiting", "Ah, at last", "I'm here", "Something need doing?"];
GLaDOS.register({
    'name': 'control',
    'desc': [
        'Provides functions to control GLaDOS.',
        'Most of the commands can only be used by user with special permissions.'
    ],
    'commands': [
        '!exit - Let GLaDOS disconnect.',
        '!join <channel> - Let GLaDOS join <channel>.',
        '!part [channel] - Let GLaDOS part [channel] or the current channel.',
        '!memory - Displays current memory usage.',
        '!raw <raw line> -  Send a raw line to the server.',
        '!ping - Test if GLaDOS is attentive.'
    ]
}, function(ircEvent, command) {
    command('exit', function(channel, user, name, text, params) {
        if(!user.hasPermissions()) return user.notice('you don\'t have the permissions to use this command.');
        GLaDOS.shutdown();
    });
    command('join', function(channel, user, name, text, params) {
        if(!user.hasPermissions()) return user.notice('you don\'t have the permissions to use this command.');
        if(params.length < 1) return user.notice('!join <Channel>');
        var chans = GLaDOS.config.get('irc:channels');
        if( chans.indexOf(params[0]) > -1 ) {
            return user.notice('i\'m already in this channel.');
        }
        GLaDOS.getChannel(params[0]).join();
        chans.push(params[0]);
        GLaDOS.config.set('irc:channels', chans);
        GLaDOS.config.save();
    });
    command('part', function(channel, user, name, text, params) {
        if(!user.hasPermissions()) return user.notice('you don\'t have the permissions to use this command.');
        var chan = params.length < 1 ? channel.getName() : params[0];
        var chans = GLaDOS.config.get('irc:channels');
        var index = chans.indexOf(chan);
        if( index == -1 ) {
            return user.notice('i\'m not in this channel.');
        }
        GLaDOS.getChannel(chan).part();
        chans.splice(index, 1);
        GLaDOS.config.set('irc:channels', chans);
        GLaDOS.config.save();
    });
    command(['mem','memory'], function(channel, user, name, text, params) {
        if(!user.hasPermissions()) return user.notice('you don\'t have the permissions to use this command.');
        var mem = process.memoryUsage();
        user.notice(readableNumber(mem.rss) + " (v8: " + readableNumber(mem.heapUsed) + " / " + readableNumber(mem.heapTotal) + ")");
        return true;
    });
    command('raw', function(channel, user, name, text, params) {
        if(!user.hasPermissions()) return user.notice('you don\'t have the permissions to use this command.');
        GLaDOS.sendRaw(text);
    });
    ircEvent('pm', function(user, text) {
        if(user.hasPermissions()) {
            var params = text.split(' ');
            if(params.length === 2 && params[0] === 'identify') {
                GLaDOS.sendMessage('NickServ', 'IDENTIFY ' + params[1]);
                GLaDOS.config.set('irc:password', params[1]);
                GLaDOS.config.save();
            }
        }
    });
    command('ping', function(channel, user, name, text, params) {
        channel.say(user.getNick() + ': ' + __.sample(phrases));
    });
});
function readableNumber(bytes) {
    var s = ['bytes', 'kB', 'MB', 'GB', 'TB', 'PB'];
    var e = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, e)).toFixed(2) + " " + s[e];
}