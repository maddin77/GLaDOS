/*global GLaDOS */
'use strict';
var request = require('request');
var cheerio = require('cheerio');
var dns = require('dns');
var whoisAvailable = require('whois-available');
var util = require('util');
var url = require('url');
var net = require('net');
var _ = require('underscore');

function getError(code) {
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
}

GLaDOS.register({
    'name': 'net',
    'description': 'Various networking utilities.',
    'commands': [
        '!isup <url> - Check the availability of a website.',
        '!geo <ip,domain,etc> - Returns geo information about the given ip or domain.',
        '!isip <string> - Checks whether or not the given string is an ip, and if so which version.',
        '!dnslookup <domain> - Looks up and returns the ip of the given domain.',
        '!dnsreverse <ip> - Reverse resolves an ip address to domain names.',
        '!dnsresolve <domain> [A/AAAA/MX/TXT/SRV/PTR/NS/CNAME] - Resolves the given domain into a list of the record types specified by rrtyp.',
        '!avail <domain> - Check if the given domain is available to buy.'
    ]
}, function (ircEvent, command) {
    command('isup', function (channel, user, name, text, params) {
        if (params.length === 0) {
            return user.notice('!isup <url>');
        }
        if (text.search(/^http[s]?\:\/\//) === -1) {
            text = 'http://' + text;
        }
        var host = url.parse(text).host;
        if (host === null) {
            return user.notice('Invalid URL.');
        }
        request({
            uri: 'http://isitup.org/' + host + '.json',
            json: true,
            headers: {
                'User-Agent': 'GLaDOS/IRC-Bot - https://github.com/maddin77/GLaDOS'
            }
        }, function (error, response, json) {
            if (!error && response.statusCode === 200) {
                if (json.status_code === 3) {
                    channel.say(user.getNick() + ': Invalid Domain.');
                } else if (json.status_code === 2) {
                    channel.say(user.getNick() + ': ' + json.domain + ' seems to be down!');
                } else if (json.status_code === 1) {
                    channel.say(user.getNick() + ': ' + json.domain + ' is up. It took ' + (json.response_time * 1000) + ' ms for a ' + json.response_code + ' response code with an ip of ' + json.response_ip + '.');
                }
            } else {
                GLaDOS.logger.error('[net] %s', (error || 'Unknown Error'), error);
                channel.say(user.getNick() + ': ' + (error || 'Unknown Error'));
            }
        });
    });
    command('geo', function (channel, user, name, text, params) {
        if (params.length === 0) {
            return user.notice('!geo <ip,domain,etc>');
        }
        request("http://ip-api.com/json/" + text, function (error, response, body) {
            if (!error && response.statusCode === 200) {
                var data = JSON.parse(body), values = [];
                if (data.status === "success") {
                    _.each(data, function (value, key, list) {
                        if (key !== 'query' && key !== 'status' && key !== 'countryCode' && key !== 'region' && key !== 'zip' && key !== 'lat' && key !== 'lon' && key !== 'timezone') {
                            if (value.length !== 0) {
                                values.push(value);
                            }
                        }
                    });
                    channel.say(user.getNick() + ": " + text + " resolves to " + data.query + " (" + values.join(", ") + ")");
                } else {
                    if (data.message === "private range") {
                        channel.say(user.getNick() + ": the IP address is part of a private range (" + data.query + ")");
                    } else if (data.message === "reserved range") {
                        channel.say(user.getNick() + ": the IP address is part of a reserved range (" + data.query + ")");
                    } else if (data.message === "invalid query") {
                        channel.say(user.getNick() + ": invalid IP address or domain name (" + data.query + ")");
                    } else {
                        channel.say(user.getNick() + ": " + data.message + " (" + data.query + ")");
                    }
                }
            } else {
                GLaDOS.logger.error('[net] %s', (error || 'Unknown Error'), error);
                channel.say(user.getNick() + ': ' + (error || 'Unknown Error'));
            }
        });
    });
    command('dnslookup', function (channel, user, name, text, params) {
        if (params.length === 0) {
            return user.notice('!dnslookup <domain>');
        }
        try {
            dns.lookup(text, function (error, address, family) {
                if (error) {
                    channel.say(user.getNick() + ": " + getError(error.code));
                } else {
                    channel.say(user.getNick() + ": " + address);
                }
            });
        } catch (error) {
            channel.say(user.getNick() + ': ' + getError(error.code));
        }
    });
    command('dnsreverse', function (channel, user, name, text, params) {
        if (params.length === 0) {
            return user.notice('!dnsreverse <ip>');
        }
        try {
            dns.reverse(text, function (error, domains) {
                if (error) {
                    channel.say(user.getNick() + ": " + getError(error.code));
                } else {
                    channel.say(user.getNick() + ": " + domains.join(", "));
                }
            });
        } catch (error) {
            channel.say(user.getNick() + ': ' + getError(error.code));
        }
    });
    command('dnsresolve', function (channel, user, name, text, params) {
        if (params.length === 0) {
            return user.notice('!dnsresolve <domain> [A/AAAA/MX/TXT/SRV/PTR/NS/CNAME]');
        }
        var rrtype = params.length === 2 ? params[1].toUpperCase() : 'A';
        try {
            dns.resolve(params[0], rrtype, function (error, addresses) {
                if (error) {
                    channel.say(user.getNick() + ': ' + getError(error.code));
                } else {
                    if (rrtype === 'MX') {
                        var exchanges = [];
                        addresses.forEach(function (entry) {
                            exchanges.push(entry.exchange + '(' + entry.priority + ')');
                        });
                        channel.say(user.getNick() + ': ' + exchanges.join(', '));
                    } else {
                        channel.say(user.getNick() + ': ' + addresses.join(', '));
                    }
                }
            });
        } catch (e) {
            channel.say(user.getNick() + ': ' + getError(e.code));
        }
    });
    command('isip', function (channel, user, name, text, params) {
        if (params.length === 0) {
            return user.notice("!isip <string>");
        }
        var ret = net.isIP(text);
        if (ret === 4) {
            channel.say(user.getNick() + ': "' + text + '" is an IP version 4 address.');
        } else if (ret === 6) {
            channel.say(user.getNick() + ': "' + text + '" is an IP version 6 address.');
        } else {
            channel.say(user.getNick() + ': "' + text + '" is not an ip.');
        }
    });
    command('avail', function (channel, user, name, text, params) {
        if (params.length === 0) {
            return user.notice("!avail <domain>");
        }
        whoisAvailable(text, function (error, whoisResponse, isAvailable) {
            if (!error) {
                channel.say(user.getNick() + ': "' + text + '" is ' + (isAvailable ? '' : 'not ') + 'available.');
            } else {
                GLaDOS.logger.error('[net] %s', (error || 'Unknown Error'), error);
                channel.say(user.getNick() + ': ' + (error || 'Unknown Error'));
            }
        });
    });
});