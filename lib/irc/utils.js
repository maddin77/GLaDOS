exports.nick = function (msg) {
    return msg.prefix.split('!')[0];
};

exports.toArray = function (val) {
    return Array.isArray(val) ? val : [val];
};