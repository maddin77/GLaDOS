'use strict';
global.GLaDOS = require('./lib/GLaDOS');
require('fs').readdir('./plugins', function (err, files) {
    files.forEach(function (fileName) {
        if (fileName !== 'example.js') {
            require('./plugins/' + fileName);
        }
    });
});