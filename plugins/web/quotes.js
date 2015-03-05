var _ = require('lodash');

exports.register = function (server, options, next) {
    server.route({
        path: '/quotes',
        method: 'GET',
        handler: function (request, reply) {
            var quotes = options.glados.brain('quotes').object;
            //console.log(quotes);
            return reply.view('quotes', {
                mainnav: '/quotes',
                quotes: quotes
            });
        }
    });
    server.route({
        path: '/quotes/add',
        method: 'POST',
        handler: function (request, reply) {
            if (!request.payload.fullname.length) {
                return reply.redirect('/quotes#voller-name-fehlt');
            }
            if (!request.payload.name.length) {
                return reply.redirect('/quotes#name-fehlt');
            }
            if (!request.payload.quote.length) {
                return reply.redirect('/quotes#zitat-fehlt');
            }
            var quotes = options.glados.brain('quotes');
            if (!_.has(quotes.object, request.payload.name)) {
                console.log('!quotes.has(name)');
                quotes.object[request.payload.name] = {
                    name: request.payload.fullname,
                    quotes: []
                };
            }
            quotes.object[request.payload.name].quotes.push(request.payload.quote);
            quotes.save();
            var id = quotes.object[request.payload.name].quotes.length - 1;
            return reply.redirect('/quotes#' + request.payload.name + '-' + id);
        }
    });
    server.route({
        path: '/quotes/del',
        method: 'GET',
        handler: function (request, reply) {
            if (!request.query.n.length) {
                return reply.redirect('/quotes#name-fehlt');
            }
            var name = request.query.n.trim();
            console.log('name', name);
            if (!request.query.i.length) {
                return reply.redirect('/quotes#id-fehlt');
            }
            var id = parseInt(request.query.i, 10);
            console.log('id', id);
            var quotes = options.glados.brain('quotes');
            if (!_.has(quotes.object, name)) {
                return reply.redirect('/quotes#name-gibts-nich');
            }
            if (!quotes.object[name].quotes[id]) {
                return reply.redirect('/quotes#id-gibts-nich');
            }
            quotes.object[name].quotes = _.filter(quotes.object[name].quotes, function (n, i) {
                return i !== id;
            });
            quotes.save();
            return reply.redirect('/quotes');
        }
    });

    return next();
};
exports.register.attributes = {
    name: 'web-quotes',
    version: '1.0.0'
};