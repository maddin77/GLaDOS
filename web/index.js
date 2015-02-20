var hapi        = require('hapi');
var path        = require('path');
var handlebars  = require('handlebars');
var swag        = require('swag');
var low         = require('lowdb');


exports.register = function (glados, next) {
    var config  = low(path.join(__dirname, '..', 'config', 'web.json'), {
        autosave: true,
        async: true
    });

    swag.registerHelpers(handlebars);

    var server = new hapi.Server({
        connections: {
            router: {
                stripTrailingSlash: true
            }
        }
    });
    server.connection({
        port: config.object.port
    });
    server.views({
        engines: {
            hbs: handlebars
        },
        defaultExtension: 'hbs',
        context: {
            //__config: config
        },
        path: path.join(__dirname, 'templates'),
        layoutPath: path.join(__dirname, 'templates'),
        partialsPath: path.join(__dirname, 'templates'),
        layout: 'layout',
        isCached: config.object.cached
    });
    server.start(function () {
        server.log('info', 'Server running at: ' + server.info.uri);
        return next();
    });
    server.on('log', function (event, tags) {
        glados.debug('[%s] %s', event.tags.join(','), event.data);

        if (tags.error) {
            //glados.debug('[%s] %s', tags.join(','), event.data)
            //console.log('Server error: ' + (event.data || 'unspecified'));
        }
    });
};
exports.attributes = {
    name: 'web',
    version: '1.0.0',
};