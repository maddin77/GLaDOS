"use strict";
var http    = require('http');
var debug   = require('debug')('GLaDOS:script:webhook');
var crypto  = require('crypto');

module.exports = function (scriptLoader, irc) {
    var httpServer = http.createServer(),
        stopped = false,
        getHashed,
        getBody;

    getHashed = function (str) {
        var sum = crypto.createHash('sha512');
        sum.update(str, 'utf8');
        return sum.digest('hex');
    };

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
            if (request.method !== 'POST') {
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
                irc.brain.get('webhook_authkey', function (err, authHash) {
                    if (err || !authHash) {
                        response.statusCode = 500;
                        response.end("500");
                        debug(err || 'no password set');
                        return;
                    }
                    if (getHashed(request.headers.authorization) === authHash) {
                        irc.write(body, function () {
                            response.statusCode = 200;
                            response.end(body);
                        });
                    } else {
                        response.statusCode = 401;
                        response.end("401");
                    }
                });
            });
        }
    });
    httpServer.addListener("connection", function (stream) {
        stream.setTimeout(0);
    });
    httpServer.listen(irc.config.webhookPort || 1337);

    scriptLoader.registerEvent('privatemessage', function (event) {
        if (irc.config.admin.indexOf(event.user.getNick()) > -1 && !event.isAction) {
            var params = event.message.split(' ');
            if (params[0].toUpperCase() === 'WEBHOOK_AUTH' && params.length > 1) {
                irc.brain.set('webhook_authkey', getHashed(params[1]), function (err, msg) {
                    event.user.say(err || msg);
                });
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