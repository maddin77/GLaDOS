var nconf   = require('nconf');
var path    = require('path');
var fs      = require('fs');

fs.readdirSync(path.join(__dirname, 'config')).forEach(function (file) {
    var filePath = path.join(__dirname, 'config', file);
    if (path.basename(filePath) === '.gitkeep') return;
    var name = path.basename(filePath, '.json');
    nconf.file(name, filePath);
});




console.log(nconf.get());

nconf.save(function (err) {
    console.log(err);
});