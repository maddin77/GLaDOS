var crypto  = require('crypto');

var readableNumber = function (bytes) {
    var s = ['bytes', 'kB', 'MB', 'GB', 'TB', 'PB'],
        e = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, e)).toFixed(2) + ' ' + s[e];
};
exports.readableNumber = readableNumber;

var pad = function (num) {
    var s = '0' + num;
    return s.substr(s.length - 2);
};
exports.pad = pad;

var formatMoney = function (money, cur) {
    if (cur === '$') {
        return '$' + money.replace(/\d(?=(\d{3})+\.)/g, '$&,');
    }
    if (cur === '€') {
        return money.replace('.', ',').replace(/\d(?=(\d{3})+\,)/g, '$&.') + '€';
    }
    return money.replace(/\d(?=(\d{3})+\.)/g, '$&,');
};
exports.formatMoney = formatMoney;

var formatTime = function (sec) {
    var hours = Math.floor(sec / 3600),
        minutes = Math.floor((sec - (hours * 3600)) / 60),
        seconds = sec - (hours * 3600) - (minutes * 60),
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

var randomPassword = function (length) {
    try {
        return crypto.pseudoRandomBytes(length ? length / 2 : 8).toString('hex');
    } catch (ex) {
        return randomPassword();
    }
};
exports.randomPassword = randomPassword;