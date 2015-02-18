var low = require('lowdb');
var path = require('path');

module.exports = function (name) {
    return low(path.join(__dirname, '..', 'brain', name + '.json'), {
        autosave: true,
        async: true
    });
};