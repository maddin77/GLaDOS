'use strict';

var readableNumber = function (bytes) {
    var s = ['bytes', 'kB', 'MB', 'GB', 'TB', 'PB'],
        e = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, e)).toFixed(2) + " " + s[e];
};
exports.readableNumber = readableNumber;

var pad = function (num) {
    var s = "0" + num;
    return s.substr(s.length - 2);
};
exports.pad = pad;

var formatTime = function (seconds) {
    return Math.floor(seconds / 60) + ':' + pad(seconds % 60);
};
exports.formatTime = formatTime;