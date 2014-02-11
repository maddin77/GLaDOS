var math = require('mathjs')();
GLaDOS.register({
    'name': 'math',
    'desc': [
        'Analyze and parse mathematical expressions.',
        'A detailed documentation about the operators, functions, constants, units, ... can be found here:',
        'https://github.com/josdejong/mathjs/blob/master/docs/expressions.md',
        'Most of them should work fine. Please note that functions and variables will only exists for the command itself.'
    ],
    'commands': [
        '!math <expression>',
        '!calculate <expression>',
        '!calc <expression>',
        '!c <expression>'
    ]
},function(ircEvent, command) {
    /*command(['calculate', 'calc', 'c', 'math'], function(channel, user, name, text, params) {
        if( params.length === 0 ) return user.notice('!math <expression>');
        try {
            var ret = math.eval(text);
            console.log(ret);
            if(typeof ret === 'function') ret = 'function';
            else if(typeof ret === 'undefined') ret = 'undefined';
            //else if(typeof ret === 'object' && !(ret instanceof Array)) ret = 'object';
            channel.say(user.getNick() + ": " + ret);
        }
        catch(e) {
            channel.say(user.getNick() + ": " + e);
        }
    });*/
});