var hapi        = require('hapi');
var path        = require('path');
var handlebars  = require('handlebars');
var swag        = require('swag');
var debug       = require('debug')('Webserver');
var _           = require('lodash');
var util        = require('util');

var _SERVER = null;
exports.getServer = function () {
    debug('getServer');
    return _SERVER;
};
exports.start = function (config, registerPluginFunction, next) {
    debug('start');

    swag.registerHelpers(handlebars);

    var _SESSION_DB = [];

    var server = new hapi.Server({
        connections: {
            router: {
                stripTrailingSlash: true
            }
        }
    });
    _SERVER = server;

    server.connection({
        port: config.object.web.port,
        uri: config.object.web.uri
    });

    var templatesDir = path.join(__dirname, '..', 'templates');
    server.views({
        engines: {
            hbs: handlebars
        },
        defaultExtension: 'hbs',
        context: {
            //__config: config
        },
        path: templatesDir,
        layoutPath: templatesDir,
        partialsPath: templatesDir,
        layout: 'layout',
        isCached: config.object.web.cached
    });

    server.state('admin', {
        ttl: null,
        encoding: 'base64json',
        clearInvalid: true,
        path: '/'
    });

    server.route({
        path: '/{path*}',
        method: 'GET',
        handler: {
            directory: {
                path: path.join(__dirname, '..', 'assets')
            }
        }
    });

    server.ext('onPreAuth', function (request, reply) {
        debug('onPreAuth');
        if (request.query.sid) {
            var valid = _.find(_SESSION_DB, {sid: request.query.sid});
            if (valid && _.has(valid, 'ts') && valid.ts >= (Date.now() - 60000)) {

                _SESSION_DB = _.remove(_SESSION_DB, function (s) {
                    return s.sid === valid.sid;
                });

                reply.state('admin', valid);
                return reply.redirect(request.path);
            } else {
                delete request.state.admin;
            }
        }
        return reply.continue();
    });
    server.ext('onPreResponse', function (request, reply) {
        debug('onPreResponse');
        if (request.response.variety === 'view') {
            request.response.source.context.__admin = request.state.admin;
        }
        return reply.continue();
    });

    server.on('response', function (request) {
        var method = '\u001b[1m' + request.method.toUpperCase() + '\u001b[22m';

        var statusCode = request.response.statusCode;
        if (statusCode >= 500) {
            statusCode = '\u001b[31m' + statusCode + '\u001b[39m';
        } else if (statusCode >= 400) {
            statusCode = '\u001b[33m' + statusCode + '\u001b[39m';
        } else if (statusCode >= 300) {
            statusCode = '\u001b[36m' + statusCode + '\u001b[39m';
        } else {
            statusCode = '\u001b[32m' + statusCode + '\u001b[39m';
        }

        server.log('info', util.format('%s %s %s %s %s (%sms)',
            request.headers['x-forwarded-for'] || request.info.remoteAddress,
            method,
            request.path,
            JSON.stringify(request.query),
            statusCode,
            Date.now() - request.info.received
        ));
    });


    server.start(function () {
        server.log('info', 'Server running at: ' + server.info.uri);
        return next();
    });

    server.on('log', function (event) {
        debug('[%s] %s', event.tags.join(','), event.data);
    });

    registerPluginFunction('getWeburl', function () {
        debug('getWeburl', server.info.uri);
        return server.info.uri;
    });

    registerPluginFunction('generateSession', function (nick) {
        var ts = Date.now();
        var sid = require('crypto').createHash('md5').update(ts + _.uniqueId(nick)).digest('hex');
        var s = {
            ts: ts,
            sid: sid,
            nick: nick
        };
        server.log(['info', 'generateSession'], s);
        _SESSION_DB.push(s);
        return s;
    });
};