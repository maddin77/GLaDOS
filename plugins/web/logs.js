var fs          = require('fs');
var path        = require('path');
var _           = require('lodash');
var Boom        = require('boom');
var os          = require('os');
var handlebars  = require('handlebars');
var autolinker  = require('autolinker');

exports.register = function (server, options, next) {
    var getChannel = function (callback) {
        fs.readdir(path.join(__dirname, '..', '..', 'brain', 'logs'), function (error, dirs) {
            if (!error) {
                dirs = _.map(dirs, function (dir) {
                    return dir.substr(1);
                });
                dirs = _.sortBy(dirs, function (dir) {
                    return dir;
                });
            }
            return callback(error, dirs);
        });
    };
    var getLogfiles = function (channel, callback) {
        fs.readdir(path.join(__dirname, '..', '..', 'brain', 'logs', '#' + channel), function (error, files) {
            if (!error) {
                files = _.map(files, function (file) {
                    return file.slice(0, -4);
                });
                files = _.sortBy(files, function (file) {
                    return file;
                }).reverse();
            }
            return callback(error, files);
        });
    };
    server.route({
        path: '/logs',
        method: 'GET',
        handler: function (request, reply) {
            getChannel(function (error, channel) {
                if (error) {
                    return reply(Boom.badImplementation(error));
                }
                return reply.view('logs', {
                    mainnav: '/logs',
                    type: 'channelList',
                    channelList: channel
                });
            });
        }
    });
    server.route({
        path: '/logs/{channel}',
        method: 'GET',
        handler: function (request, reply) {
            var channel =  encodeURIComponent(request.params.channel);
            getLogfiles(channel, function (error, files) {
                if (error) {
                    return reply(Boom.badImplementation(error));
                }
                return reply.view('logs', {
                    mainnav: '/logs',
                    type: 'logList',
                    channel: channel,
                    files: files
                });
            });
        }
    });
    server.route({
        path: '/logs/{channel}/latest',
        method: 'GET',
        handler: function (request, reply) {
            var channel =  encodeURIComponent(request.params.channel);
            return getLogfiles(channel, function (error, files) {
                if (error) {
                    return reply(Boom.badImplementation(error));
                }
                return reply.redirect('/logs/' + channel + '/' + files[0]);
            });
        }
    });
    server.route({
        path: '/logs/{channel}/{logFile}',
        method: 'GET',
        handler: function (request, reply) {
            var channel =  encodeURIComponent(request.params.channel);
            var logFile =  encodeURIComponent(request.params.logFile);
            var fileName = path.join(__dirname, '..', '..', 'brain', 'logs', '#' + channel, logFile + '.log');
            fs.readFile(fileName, {encoding: 'utf8'}, function (error, contents) {
                if (error) {
                    return reply(Boom.badImplementation(error));
                }

                var data = null;
                data = '[';
                data += contents.split(os.EOL).join(',');
                data = data.slice(0, -1);
                data += ']';
                data = JSON.parse(data);

                data = _.map(data, function (d) {
                    d.date = new Date(d.ts);
                    if (d.event === 'message') {
                        d.info.message = handlebars.Utils.escapeExpression(d.info.message);
                        d.info.message = autolinker.link(d.info.message, {
                            stripPrefix: false,
                            twitter: false,
                        });
                    }
                    return d;
                });
                return reply.view('logs', {
                    mainnav: '/logs',
                    type: 'logFile',
                    channel: channel,
                    logFile: logFile,
                    data: data
                });
            });
        }
    });

    return next();
};
exports.register.attributes = {
    name: 'web-logs',
    version: '1.0.0'
};