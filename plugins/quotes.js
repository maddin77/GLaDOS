var _ = require('lodash');

exports.register = function (glados, next) {
    glados.hear(/^!q(?:uote)?( \S+)?( \d+)?$/i, function (match, event) {
        var name = match[1] ? match[1].trim().toLowerCase() : null;
        var id = match[2] ? parseInt(match[2].trim(), 10) : -1;
        if (!name) {
            return event.user.notice('Benutze: !quote <Wer> [#]');
        }
        if (name === 'list') {
            return event.user.notice(glados.getWeburl() + '/quotes');
        }
        if (name === 'add') {
            var s = glados.generateSession(event.user.getNick());
            event.user.notice('Eine Session wurde auf deinen Nick (%s) registriert. Du kannst dich nun über folgenden Link anmelden:', s.nick);
            event.user.notice(glados.getWeburl() + '/quotes/?sid=' + s.sid);
            event.user.notice('Der Link kann ein mal genutzt werden und verfällt automatisch in 60 Sekunden.');
            return;
        }
        var quotes = glados.brain('quotes').object;

        if (!_.has(quotes, name) || quotes[name].quotes.length === 0) {
            return event.user.notice('Tut mir leid, ich habe keine Zitate von "%s".', name);
        }
        quotes = quotes[name];
        if (id !== -1 && id > (quotes.quotes.length - 1)) {
            return event.user.notice('Tut mir leid, ich habe nur %s Zitate von %s.', quotes.quotes.length, quotes.name);
        }
        event.channel.say('"%s" — %s', (id === -1 ? _.sample(quotes.quotes) : quotes.quotes[id]), quotes.name);
    });

    //========
    glados.web().route({
        path: '/quotes',
        method: 'GET',
        handler: function (request, reply) {
            var quotes = glados.brain('quotes').object;
            //console.log(quotes);
            return reply.view('quotes', {
                mainnav: '/quotes',
                quotes: quotes
            });
        }
    });
    glados.web().route({
        path: '/quotes/add',
        method: 'POST',
        handler: function (request, reply) {
            if (!request.state.admin) {
                return reply.redirect('/quotes');
            }
            if (!request.payload.fullname.length) {
                return reply.redirect('/quotes#voller-name-fehlt');
            }
            if (!request.payload.name.length) {
                return reply.redirect('/quotes#name-fehlt');
            }
            if (!request.payload.quote.length) {
                return reply.redirect('/quotes#zitat-fehlt');
            }
            var quotes = glados.brain('quotes');
            if (!_.has(quotes.object, request.payload.name)) {
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
    glados.web().route({
        path: '/quotes/del',
        method: 'GET',
        handler: function (request, reply) {
            if (!request.state.admin) {
                return reply.redirect('/quotes');
            }
            if (!request.query.n.length) {
                return reply.redirect('/quotes#name-fehlt');
            }
            var name = request.query.n.trim();
            if (!request.query.i.length) {
                return reply.redirect('/quotes#id-fehlt');
            }
            var id = parseInt(request.query.i, 10);
            var quotes = glados.brain('quotes');
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
exports.info = {
    name: 'quotes',
    displayName: 'Zitate',
    desc: ['Eine Liste mit allen Zitaten findest du <a href="/quotes">hier</a>.'],
    version: '1.0.0',
    commands: [{
        name: 'quote',
        alias: ['q'],
        params: {
            'Name': 'required',
            'Nummer': 'optional'
        },
        desc: [
            'Gibt ein zufälliges Zitat vom angegebenen Namen aus.',
            'Alternativ kann auch das Zitat mit der angegebenen Nummer ausgegeben werden.'
        ]
    },{
        name: 'quote LIST',
        alias: ['q'],
        desc: ['Gibt einen Link aus um alle Zitate in der Datenbank einzusehen.']
    },{
        name: 'quote ADD',
        alias: ['q'],
        desc: [
            'Erstellt eine Admin Session zum bearbeiten der Zitate.',
            'Kann nur von Administratoren genutzt werden.',
        ]
    }]
};