process.env.DEBUG = '*';

var blocked = require('blocked');
blocked(function(ms){
    console.log('BLOCKED FOR %sms', ms | 0);
});

require('./lib/glados');