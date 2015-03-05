var hapi        = require('hapi');
var path        = require('path');
var handlebars  = require('handlebars');
var swag        = require('swag');


exports.register = function (glados, next) {
    var config  = glados._config.object.web;

    swag.registerHelpers(handlebars);

    var server = new hapi.Server({
        connections: {
            router: {
                stripTrailingSlash: true
            }
        }
    });

    server.connection({
        port: config.port
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
        isCached: config.cached
    });

    server.register([{
        register: require(path.join(__dirname, 'auth')),
        options: {
            glados: glados
        }
    },{
        register: require(path.join(__dirname, 'assets'))
    },{
        register: require(path.join(__dirname, 'help'))
    },{
        register: require(path.join(__dirname, 'plugins'))
    },{
        register: require(path.join(__dirname, 'sinfo'))
    },{
        register: require(path.join(__dirname, 'logs'))
    },{
        register: require(path.join(__dirname, 'quotes')),
        options: {
            glados: glados
        }
    }], function (err) {
        if (err) {
            throw err; // bad bad
        }


        server.start(function () {
            server.log('info', 'Server running at: ' + server.info.uri);
            return next();
        });
    });

    server.on('log', function (event, tags) {
        glados.debug('[%s] %s', event.tags.join(','), event.data);

        if (tags.error) {
            //glados.debug('[%s] %s', tags.join(','), event.data)
            //console.log('Server error: ' + (event.data || 'unspecified'));
        }
    });

    glados.register('getWeburl', function () {
        return server.info.uri;
    });
};
exports.info = {
    name: 'web',
    displayName: 'Web',
    desc: ['Du nutzt es gerade.'],
    version: '1.0.0'
};