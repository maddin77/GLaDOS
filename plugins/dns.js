var dns     = require('dns');
var _       = require('lodash');
var request = require('request');

exports.register = function (glados, next) {

    var getError = function (code) {
        switch (code) {
        case 'ENODATA':
            return 'DNS server returned answer with no data.';
        case 'EFORMERR':
            return 'DNS server claims query was misformatted.';
        case 'ESERVFAIL':
            return 'DNS server returned general failure.';
        case 'ENOTFOUND':
            return 'Domain name not found.';
        case 'NOTFOUND':
            return 'Domain name not found.';
        case 'ENOTIMP':
            return 'DNS server does not implement requested operation.';
        case 'EREFUSED':
            return 'DNS server refused query.';
        case 'EBADQUERY':
            return 'Misformatted DNS query.';
        case 'EBADNAME':
            return 'Misformatted domain name.';
        case 'EBADFAMILY':
            return 'Unsupported address family.';
        case 'EBADRESP':
            return 'Misformatted DNS reply.';
        case 'ECONNREFUSED':
            return 'Could not contact DNS servers.';
        case 'ETIMEOUT':
            return 'Timeout while contacting DNS servers.';
        case 'EOF':
            return 'End of file.';
        case 'EFILE':
            return 'Error reading file.';
        case 'ENOMEM':
            return 'Out of memory.';
        case 'EDESTRUCTION':
            return 'Channel is being destroyed.';
        case 'EBADSTR':
            return 'Misformatted string.';
        case 'EBADFLAGS':
            return 'Illegal flags specified.';
        case 'ENONAME':
            return 'Given hostname is not numeric.';
        case 'EBADHINTS':
            return 'Illegal hints flags specified.';
        case 'ENOTINITIALIZED':
            return 'c-ares library initialization not yet performed.';
        case 'ELOADIPHLPAPI':
            return 'Error loading iphlpapi.dll.';
        case 'EADDRGETNETWORKPARAMS':
            return ' Could not find GetNetworkParams function.';
        case 'ECANCELLED':
            return 'DNS query cancelled.';
        default:
            return 'Unknown Error';
        }
    };

    glados.hear(/^!dnslookup( \S+)?$/i, function (match, event) {
        var target = match[1] ? match[1].trim() : null;
        if (!target) {
            return event.user.notice('Benutze: !dnslookup <Domain>');
        }
        try {
            dns.lookup(target, function (error, address) {
                if (error) {
                    event.channel.reply(event.user, getError(error.code));
                } else {
                    event.channel.reply(event.user, address);
                }
            });
        } catch (error) {
            event.channel.reply(event.user, 'Gratz. You broke it. (' + getError(error.code) + ')');
            glados.debug('[dnslookup] %s', getError(error.code), error);
        }
    });

    glados.hear(/^!dnsreverse( \S+)?$/i, function (match, event) {
        var target = match[1] ? match[1].trim() : null;
        if (!target) {
            return event.user.notice('Benutze: !dnsreverse <IP>');
        }
        try {
            dns.reverse(target, function (error, domains) {
                if (error) {
                    event.channel.reply(event.user, getError(error.code));
                } else {
                    event.channel.reply(event.user, domains.join(', '));
                }
            });
        } catch (error) {
            event.channel.reply(event.user, 'Gratz. You broke it. (' + getError(error.code) + ')');
            glados.debug('[dnslookup] %s', getError(error.code), error);
        }
    });

    glados.hear(/^!dnsresolve( \S+)?(?:(?: )(A|AAAA|MX|TXT|SRV|PTR|NS|CNAME|SOA))?$/i, function (match, event) {
        var target = match[1] ? match[1].trim() : null;
        var rrtype = match[2] ? match[2].trim() : 'A';
        if (!target) {
            return event.user.notice('Benutze: !dnsresolve <Domain> [A/AAAA/MX/TXT/SRV/PTR/NS/CNAME/SOA]');
        }
        try {
            dns.resolve(target, rrtype, function (error, addresses) {
                if (error) {
                    event.channel.reply(event.user, getError(error.code));
                } else {
                    if (rrtype === 'MX') {
                        var exchanges = [];
                        addresses.forEach(function (entry) {
                            exchanges.push(entry.exchange + '(' + entry.priority + ')');
                        });
                        event.channel.reply(event.user, exchanges.join(', '));
                    } else {
                        event.channel.reply(event.user, addresses.join(', '));
                    }
                }
            });
        } catch (error) {
            event.channel.reply(event.user, 'Gratz. You broke it. (' + getError(error.code) + ')');
            glados.debug('[dnsresolve] %s', getError(error.code), error);
        }
    });

    glados.hear(/^!avail( \S+)?$/i, function (match, event) {
        var target = match[1] ? match[1].trim() : null;
        if (!target) {
            return event.user.notice('Benutze: !avail <Domain>');
        }
        var split   = target.split('.');
        var tld     = _.last(split);
        var domain  = target.replace('.' + tld, '');
        request({
            'uri': 'https://domaintyper.com/DomainCheckHandler.ashx?domain=' + domain + '&TDLS=["' + tld + '"]',
            'json': true,
            'headers': {
                'User-Agent': glados.config.object.userAgent
            }
        }, function (error, response, json) {
            if (!error && response.statusCode === 200) {
                event.channel.reply(event.user, '"' + target + '" ist ' + (json.OtherDomainValues[0] === 'True' ? '' : 'nicht ') + 'verfügbar.');
            } else {
                event.channel.reply(event.user, 'Gratz. You broke it. (' + error + ')');
                glados.debug('[avail] %s', error);
            }
        });
    });


    return next();
};
exports.info = {
    name: 'dns',
    displayName: 'Domain Name System Tools',
    desc: ['Bietet verschiedene Befehle um mit dem DNS Dienst zu interagieren.'],
    version: '1.0.0',
    commands: [{
        name: 'dnslookup',
        params: {
            'Domain': 'required'
        },
        desc: ['Löst die angegebene Domain zu einer IP Adresse auf.']
    }, {
        name: 'dnsreverse',
        params: {
            'IP': 'required'
        },
        desc: ['Löst die angegebene IP Adresse zu einem Hostnamen auf.']
    }, {
        name: 'dnsresolve',
        params: {
            'Domain': 'required',
            'RRTYPE': 'optional'
        },
        desc: [
            'Löst die angegebene Domain zu einer oder mehreren IP Adressen auf.',
            'Mögliche RRTYPEN sind: A, AAAA, MX, TXT, SRV, PTR, NS, CNAME und SOA.'
        ]
    }, {
        name: 'avail',
        params: {
            'Domain': 'required'
        },
        desc: ['Prüft ob die angegebene Domain noch verfügbar ist.']
    }]
};