if(process.env.hasOwnProperty('OPENSHIFT_DATA_DIR')) {
    GLOBAL.DATA_DIR = process.env.OPENSHIFT_DATA_DIR;
} else {
    GLOBAL.DATA_DIR = __dirname + '/data/';
}
GLOBAL.GLaDOS = require('./lib/GLaDOS');
require('fs').readdir("./plugins", function(err, files) {
    files.forEach(function(fileName) {
        if(fileName === 'example.js') return;
        require('./plugins/' + fileName);
    });
});