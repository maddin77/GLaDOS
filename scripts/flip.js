'use strict';

var chars = {
    'a' : '\u0250',
    'b' : 'q',
    'c' : '\u0254',
    'd' : 'p',
    'e' : '\u01DD',
    'f' : '\u025F',
    'g' : 'b',
    'h' : '\u0265',
    'i' : '\u0131',
    'j' : '\u027E',
    'k' : '\u029E',
    'l' : '\u05DF',
    'm' : '\u026F',
    'n' : 'u',
    'o' : 'o',
    'p' : 'd',
    'q' : 'b',
    'r' : '\u0279',
    's' : 's',
    't' : '\u0287',
    'u' : 'n',
    'v' : '\u028C',
    'w' : '\u028D',
    'x' : 'x',
    'y' : '\u028E',
    'z' : 'z',
    '[' : ']',
    ']' : '[',
    '(' : ')',
    ')' : '(',
    '{' : '}',
    '}' : '{',
    '?' : '\u00BF',
    '\u00BF' : '?',
    '!' : '\u00A1',
    "\'" : ',',
    ',' : "\'",
    '.' : '\u02D9',
    '_' : '\u203E',
    ';' : '\u061B',
    '9' : '6',
    '6' : '9',
    '\u2234' : '\u2235',
    '>' : '<',
    '<' : '>',
    '/' : '\\',
    '\\' : '/'
};

module.exports = function (irc) {
    irc.command(['flip', 'flipme'], function (event) {
        if (event.params.length > 0) {
            event.channel.reply(event.user, '(\u256F\u00B0\u25A1\u00B0\uFF09\u256F\uFE35 ' + event.text.toLowerCase().split('').map(function (c) {
                return chars[c] || c;
            }).reverse().join(''));
        } else {
            event.user.notice('Use: !flip <what>');
        }
    });
};