'use strict';
var request = require('request');
var cheerio = require('cheerio');
var dns = require('dns');
var whoisAvailable = require('whois-available');
var util = require('util');
var url = require('url');
var net = require('net');
var _ = require('underscore');
var debug = require('debug')('glados:script:net');

module.exports = function () {

    var getError = function (code) {
        switch (code) {
        case 'ENODATA':
            return "DNS server returned answer with no data.";
        case 'EFORMERR':
            return "DNS server claims query was misformatted.";
        case 'ESERVFAIL':
            return "DNS server returned general failure.";
        case 'ENOTFOUND':
            return "Domain name not found.";
        case 'NOTFOUND':
            return "Domain name not found.";
        case 'ENOTIMP':
            return "DNS server does not implement requested operation.";
        case 'EREFUSED':
            return "DNS server refused query.";
        case 'EBADQUERY':
            return "Misformatted DNS query.";
        case 'EBADNAME':
            return "Misformatted domain name.";
        case 'EBADFAMILY':
            return "Unsupported address family.";
        case 'EBADRESP':
            return "Misformatted DNS reply.";
        case 'ECONNREFUSED':
            return "Could not contact DNS servers.";
        case 'ETIMEOUT':
            return "Timeout while contacting DNS servers.";
        case 'EOF':
            return "End of file.";
        case 'EFILE':
            return "Error reading file.";
        case 'ENOMEM':
            return "Out of memory.";
        case 'EDESTRUCTION':
            return "Channel is being destroyed.";
        case 'EBADSTR':
            return "Misformatted string.";
        case 'EBADFLAGS':
            return "Illegal flags specified.";
        case 'ENONAME':
            return "Given hostname is not numeric.";
        case 'EBADHINTS':
            return "Illegal hints flags specified.";
        case 'ENOTINITIALIZED':
            return "c-ares library initialization not yet performed.";
        case 'ELOADIPHLPAPI':
            return "Error loading iphlpapi.dll.";
        case 'EADDRGETNETWORKPARAMS':
            return " Could not find GetNetworkParams function.";
        case 'ECANCELLED':
            return "DNS query cancelled.";
        default:
            return 'Unknown Error';
        }
    };

    return function (irc) {
        irc.command('isup', function (event) {
            if (event.params.length > 0) {
                var text = event.text, host;
                if (text.search(/^http[s]?\:\/\//) === -1) {
                    text = 'http://' + text;
                }
                host = url.parse(text).host;
                if (host !== null) {
                    request({
                        "uri": 'http://isitup.org/' + host + '.json',
                        "json": true,
                        "headers": {
                            "User-Agent": irc.config.userAgent
                        }
                    }, function (error, response, json) {
                        if (!error && response.statusCode === 200) {
                            if (json.status_code === 3) {
                                event.channel.reply(event.user, 'Invalid Domain.');
                            } else if (json.status_code === 2) {
                                event.channel.reply(event.user, json.domain + ' seems to be down!');
                            } else if (json.status_code === 1) {
                                event.channel.reply(event.user, json.domain + ' is up. It took ' + (json.response_time * 1000) + ' ms for a ' + json.response_code + ' response code with an ip of ' + json.response_ip + '.');
                            }
                        } else {
                            event.channel.reply(event.user, 'Gratz. You broke it. (' + error + ')');
                            debug('[isup] %s', error);
                        }
                    });
                } else {
                    event.user.notice('Invalid URL.');
                }
            } else {
                event.user.notice('Use: !isup <url>');
            }
        });
        irc.command('geo', function (event) {
            if (event.params.length > 0) {
                request({
                    "uri": 'http://ip-api.com/json/' + event.text,
                    "json": true,
                    "headers": {
                        "User-Agent": irc.config.userAgent
                    }
                }, function (error, response, data) {
                    if (!error && response.statusCode === 200) {
                        if (data.status === "success") {
                            var values = [];
                            _.each(data, function (value, key, list) {
                                if (value.length > 0 && key !== 'query' && key !== 'status' && key !== 'countryCode' && key !== 'region' && key !== 'zip' && key !== 'lat' && key !== 'lon' && key !== 'timezone') {
                                    values.push(value);
                                }
                            });
                            event.channel.reply(event.user, ': ' + event.text + ' resolves to ' + data.query + ' (' + values.join(', ') + ')');
                        } else {
                            if (data.message === "private range") {
                                event.channel.reply(event.user, 'The IP address is part of a private range (' + data.query + ')');
                            } else if (data.message === "reserved range") {
                                event.channel.reply(event.user, 'The IP address is part of a reserved range (' + data.query + ')');
                            } else if (data.message === "invalid query") {
                                event.channel.reply(event.user, 'Invalid IP address or domain name (' + data.query + ')');
                            } else {
                                event.channel.reply(event.user, data.message + ' (' + data.query + ')');
                            }
                        }
                    } else {
                        event.channel.reply(event.user, 'Gratz. You broke it. (' + error + ')');
                        debug('[geo] %s', error);
                    }
                });
            } else {
                event.user.notice('Use: !geo <ip, domain, etc>');
            }
        });
        irc.command('dnslookup', function (event) {
            if (event.params.length > 0) {
                try {
                    dns.lookup(event.text, function (error, address, family) {
                        if (error) {
                            event.channel.reply(event.user, getError(error.code));
                        } else {
                            event.channel.reply(event.user, address);
                        }
                    });
                } catch (error) {
                    event.channel.reply(event.user, 'Gratz. You broke it. (' + getError(error.code) + ')');
                    debug('[dnslookup] %s', getError(error.code), error);
                }
            } else {
                event.user.notice('Use: !dnslookup <domain>');
            }
        });
        irc.command('dnsreverse', function (event) {
            if (event.params.length > 0) {
                try {
                    dns.reverse(event.text, function (error, domains) {
                        if (error) {
                            event.channel.reply(event.user, getError(error.code));
                        } else {
                            event.channel.reply(event.user, domains.join(', '));
                        }
                    });
                } catch (error) {
                    event.channel.reply(event.user, 'Gratz. You broke it. (' + getError(error.code) + ')');
                    debug('[dnsreverse] %s', getError(error.code), error);
                }
            } else {
                event.user.notice('Use: !dnsreverse <ip>');
            }
        });
        irc.command('dnsresolve', function (event) {
            if (event.params.length > 0) {
                var rrtype = event.params.length === 2 ? event.params[1].toUpperCase() : 'A';
                try {
                    dns.resolve(event.params[0], rrtype, function (error, addresses) {
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
                    debug('[dnsresolve] %s', getError(error.code), error);
                }
            } else {
                event.user.notice('Use: !dnsresolve <domain> [A/AAAA/MX/TXT/SRV/PTR/NS/CNAME]');
            }
        });
        irc.command('isip', function (event) {
            if (event.params.length > 0) {
                var ret = net.isIP(event.text);
                if (ret === 4) {
                    event.channel.reply(event.user, '"' + event.text + '" is an IP version 4 address.');
                } else if (ret === 6) {
                    event.channel.reply(event.user, '"' + event.text + '" is an IP version 6 address.');
                } else {
                    event.channel.reply(event.user, '"' + event.text + '" is not an ip.');
                }
            } else {
                event.user.notice('Use: !isip <string>');
            }
        });
        irc.command('avail', function (event) {
            if (event.params.length > 0) {
                whoisAvailable(event.text, function (error, whoisResponse, isAvailable) {
                    if (!error) {
                        event.channel.reply(event.user, '"' + event.text + '" is ' + (isAvailable ? '' : 'not ') + 'available.');
                    } else {
                        event.channel.reply(event.user, 'Gratz. You broke it. (' + error + ')');
                        debug('[avail] %s', getError(error.code), error);
                    }
                });
            } else {
                event.user.notice('Use: !avail <domain>');
            }
        });
    };
};