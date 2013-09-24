var dns = require('dns');
var net = require('net');
var request = require('request');
var NetPlugin = function() {};
NetPlugin.prototype.getError = function(code) {
    switch(code) {
        case 'ENODATA': return "DNS server returned answer with no data.";
        case 'EFORMERR': return "DNS server claims query was misformatted.";
        case 'ESERVFAIL': return "DNS server returned general failure.";
        case 'ENOTFOUND': return "Domain name not found.";
        case 'NOTFOUND': return "Domain name not found.";
        case 'ENOTIMP': return "DNS server does not implement requested operation.";
        case 'EREFUSED': return "DNS server refused query.";
        case 'EBADQUERY': return "Misformatted DNS query.";
        case 'EBADNAME': return "Misformatted domain name.";
        case 'EBADFAMILY': return "Unsupported address family.";
        case 'EBADRESP': return "Misformatted DNS reply.";
        case 'EBADRESP': return "Domain name not found.";
        case 'ECONNREFUSED': return "Could not contact DNS servers.";
        case 'ETIMEOUT': return "Timeout while contacting DNS servers.";
        case 'EOF': return "End of file.";
        case 'EFILE': return "Error reading file.";
        case 'ENOMEM': return "Out of memory.";
        case 'EDESTRUCTION': return "Channel is being destroyed.";
        case 'EBADSTR': return "Misformatted string.";
        case 'EBADFLAGS': return "Illegal flags specified.";
        case 'ENONAME': return "Given hostname is not numeric.";
        case 'EBADHINTS': return "Illegal hints flags specified.";
        case 'ENOTINITIALIZED': return "c-ares library initialization not yet performed.";
        case 'ELOADIPHLPAPI': return "Error loading iphlpapi.dll.";
        case 'EADDRGETNETWORKPARAMS': return " Could not find GetNetworkParams function.";
        case 'ECANCELLED': return "DNS query cancelled.";
    }
};
NetPlugin.prototype.onCommand = function(server, channel, name, params, user, text, message) {
    if(name == "geo") {
        if( params.length === 0 ) return user.notice("!geo <IP,Domain,etc>");
        request("http://ip-api.com/json/"+text, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var data = JSON.parse(body);
                if(data.status == "success") {
                    var _values = [];
                    for(var key in data) {
                        if(key == "query" || key == "status" || key == "countryCode" || key == "region" || key == "zip" || key == "lat" || key == "lon" || key == "timezone") continue;
                        var value = data[key];
                        if(value.length !== 0) {
                            _values.push(value);
                        }
                    }
                    return channel.say(user.getNick() + ": " + text + " resolves to " + data.query + " (" + _values.join(", ") + ")");
                }
                else {
                    if(data.message == "private range") {
                        return channel.say(user.getNick() + ": the IP address is part of a private range (" + data.query + ")");
                    }
                    else if(data.message == "reserved range") {
                        return channel.say(user.getNick() + ": the IP address is part of a reserved range (" + data.query + ")");
                    }
                    else if(data.message == "invalid query") {
                        return channel.say(user.getNick() + ": invalid IP address or domain name (" + data.query + ")");
                    }
                    else return channel.say(user.getNick() + ": " + data.message + " (" + data.query + ")");
                }
            }
        });
        return true;
    }
    else if(name == "dns") {
        if(params.length < 1) return user.notice("!dns <LOOKUP/RESOLVE/REVERSE>");
        if(params[0].toLowerCase() == "lookup") {
            if(params.length == 1) return user.notice("!dns LOOKUP <Domain> [family]");
            var domain = params[1];
            var family = params.length == 3 ? parseInt(params[2], 10) : 4;
            try {
                var that = this;
                dns.lookup(domain, family, function(err, address, family) {
                    if(err) return channel.say(user.getNick() + ": " + that.getError(err.code));
                    else return channel.say(user.getNick() + ": " + address);
                });
            }
            catch(e) {
                channel.say(user.getNick() + ": " + this.getError(e.code));
            }
        }
        else if(params[0].toLowerCase() == "resolve") {
            if(params.length == 1) return user.notice("!dns RESOLVE <Domain> [A/AAAA/MX/NS]");
            var _domain = params[1];
            var rrtype = params.length == 3 ? params[2].toUpperCase() : 'A';
            try {
                var _that = this;
                dns.resolve(_domain, rrtype, function(err, addresses) {
                    if(err) return channel.say(user.getNick() + ": " + _that.getError(err.code));
                    else {
                        if(rrtype == 'MX') {
                            var str = [];
                            for(var i in addresses) {
                                var j = 0, s = "";
                                for(var k in addresses[i]) {
                                    if(j === 0) s += addresses[i][k] + " (";
                                    else s += addresses[i][k] + ")";
                                    j++;
                                }
                                str.push(s);
                            }
                            return channel.say(user.getNick() + ": " + str.join(", "));
                        }
                        else {
                            return channel.say(user.getNick() + ": " + addresses.join(", "));
                        }
                    }
                });
            }
            catch(e) {
                channel.say(user.getNick() + ": " + this.getError(e.code));
            }
        }
        else if(params[0].toLowerCase() == "reverse") {
            if(params.length == 1) return user.notice("!dns REVERSE <IP>");
            var ip = params[1];
            try {
                var __that = this;
                dns.reverse(ip, function(err, domains) {
                    if(err) return channel.say(user.getNick() + ": " + __that.getError(err.code));
                    else return channel.say(user.getNick() + ": " + domains.join(", "));
                });
            }
            catch(e) {
                channel.say(user.getNick() + ": " + this.getError(e.code));
            }
        }
        else return user.notice("!dns <LOOKUP/RESOLVE/REVERSE>");
    }
    else if(name == "isip") {
        if(params.length === 0) return user.notice("!isip <Input>");
        var ret = net.isIP(params[0]);
        if(ret == 4) return channel.say(user.getNick() + ": \"" + params[0] + "\" is a IP version 4 address.");
        else if(ret == 6) return channel.say(user.getNick() + ": \"" + params[0] + "\" is a IP version 6 address.");
        else return channel.say(user.getNick() + ": \"" + params[0] + "\" is a invalid String.");
    }
    else if(name == "isipv4") {
        if(params.length === 0) return user.notice("!isipv4 <Input>");
        if(net.isIPv4(params[0])) return channel.say(user.getNick() + ": \"" + params[0] + "\" is a IP version 4 address.");
        else return channel.say(user.getNick() + ": \"" + params[0] + "\" is not a IP version 4 address.");
    }
    else if(name == "isipv6") {
        if(params.length === 0) return user.notice("!isipv6 <Input>");
        if(net.isIPv6(params[0])) return channel.say(user.getNick() + ": \"" + params[0] + "\" is a IP version 4 address.");
        else return channel.say(user.getNick() + ": \"" + params[0] + "\" is not a IP version 4 address.");
    }
};
NetPlugin.prototype.onHelp = function(server, user, text) {
    user.say("Random Networking utilities.");
    user.say("Commands: !geo <IP,Domain,etc>, !dns LOOKUP <Domain> [4/6], !dns RESOLVE <Domain> [A/AAAA/MX/NS], !dns REVERSE <IP>, !isIP <Input>, !isIPv4 <Input>, !isIPv6 <Input>");
};
module.exports = new NetPlugin();