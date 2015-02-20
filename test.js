var path    = require('path');

var p = path.join(__dirname, 'plugins', 'echo.js');
console.log(p);
var parsed = path.parse(p);
console.log(parsed);