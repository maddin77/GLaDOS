"use strict";
var http    = require('http');
var debug   = require('debug')('GLaDOS:script:webhook');
var utils   = require(__dirname + '/../lib/utils');

module.exports = function (scriptLoader, irc) {
    var httpServer = http.createServer(),
        stopped = false,
        getBody,
        webhookdb = irc.database('webhook');

    webhookdb.port      = webhookdb.port || 1337;
    webhookdb.auth      = webhookdb.auth || utils.randomPassword(32);
    webhookdb.method    = webhookdb.method || 'POST';
    webhookdb.save();

    getBody = function (req, fn) {
        var body = '';
        req.on('data', function (data) {
            body += data;
        });
        req.on('end', function () {
            fn(body);
        });
    };

    httpServer.on("request", function (request, response) {
        if (stopped) {
            response.end();
            request.connection.end();
            request.connection.destroy();
        } else {
            if (request.method !== webhookdb.method) {
                response.statusCode = 405;
                response.end("405");
                return;
            }
            if (!request.headers.authorization) {
                response.statusCode = 401;
                response.end("401");
                return;
            }
            getBody(request, function (body) {
                if (!webhookdb.auth) {
                    response.statusCode = 500;
                    response.end("500");
                    debug('no password set');
                    return;
                }
                if (request.headers.authorization === webhookdb.auth) {
                    irc.write(body, function () {
                        response.statusCode = 200;
                        response.end(body);
                    });
                } else {
                    response.statusCode = 401;
                    response.end("401");
                }
            });
        }
    });
    httpServer.addListener("connection", function (stream) {
        stream.setTimeout(0);
    });
    httpServer.listen(webhookdb.port);
    debug('Listening on port %s', webhookdb.port);

    scriptLoader.registerEvent('privatemessage', function (event) {
        if (irc.config.admin.indexOf(event.user.getNick()) > -1 && !event.isAction) {
            var params = event.message.split(' ');
            if (params[0].toUpperCase() === 'WEBHOOK_AUTH' && params.length > 1) {
                webhookdb.auth = params[1];
                webhookdb.save();
                event.user.say('Ok.');
            }
        }
    });

    scriptLoader.unload(function () {
        if (!stopped) {
            stopped = true;
            httpServer.close();
        }
    });
};