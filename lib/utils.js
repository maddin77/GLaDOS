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

var formatTime = function (sec_num) {
    var hours = Math.floor(sec_num / 3600),
        minutes = Math.floor((sec_num - (hours * 3600)) / 60),
        seconds = sec_num - (hours * 3600) - (minutes * 60),
        time = '';

    if (hours > 0) {
        time += (hours + ':');
        time += (pad(minutes, 2) + ':');
    } else {
        time += (minutes + ':');
    }
    time += pad(seconds, 2);
    return time;
};
exports.formatTime = formatTime;