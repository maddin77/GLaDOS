module.exports = {
    dns: require('dns'),
    getError: function(ErrCode) {
        switch(ErrCode) {
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
    },
    onCommand: function(client, server, channel, commandChar, name, params, user, text, message) {
        if(name == "dns") {
            if(params.length < 1) return client.notice(user.getNick(), commandChar + name + " <LOOKUP/RESOLVE/REVERSE>");
            if(params[0].toLowerCase() == "lookup") {
                if(params.length == 1) return client.notice(user.getNick(), commandChar + name + " LOOKUP <domain> [family]");
                var domain = params[1];
                var family = params.length == 3 ? parseInt(params[2], 10) : 4;
                var that = this;
                try {
                    this.dns.lookup(domain, family, function(err, address, family) {
                        if(err) return client.say(channel.getName(), user.getNick() + ": " + that.getError(err.code));
                        else return client.say(channel.getName(), user.getNick() + ": " + address);
                    });
                }
                catch(e) {
                    client.say(channel.getName(), user.getNick() + ": " + that.getError(e.code));
                }
            }
            else if(params[0].toLowerCase() == "resolve") {
                if(params.length == 1) return client.notice(user.getNick(), commandChar + name + " RESOLVE <Domain> [A/AAAA/MX/NS]");
                var _domain = params[1];
                var rrtype = params.length == 3 ? params[2].toUpperCase() : 'A';
                var _that = this;
                try {
                    this.dns.resolve(_domain, rrtype, function(err, addresses) {
                        if(err) return client.say(channel.getName(), user.getNick() + ": " + _that.getError(err.code));
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
                                return client.say(channel.getName(), user.getNick() + ": " + str.join(", "));
                            }
                            else {
                                return client.say(channel.getName(), user.getNick() + ": " + addresses.join(", "));
                            }
                        }
                    });
                }
                catch(e) {
                    client.say(channel.getName(), user.getNick() + ": " + _that.getError(e.code));
                }
            }
            else if(params[0].toLowerCase() == "reverse") {
                if(params.length == 1) return client.notice(user.getNick(), commandChar + name + " REVERSE <IP>");
                var ip = params[1];
                var __that = this;
                try {
                    this.dns.reverse(ip, function(err, domains) {
                        if(err) return client.say(channel.getName(), user.getNick() + ": " + __that.getError(err.code));
                        else return client.say(channel.getName(), user.getNick() + ": " + domains.join(", "));
                    });
                }
                catch(e) {
                    client.say(channel.getName(), user.getNick() + ": " + __that.getError(e.code));
                }
            }
            else return client.notice(user.getNick(), commandChar + name + " <LOOKUP/RESOLVE/REVERSE>");
            return true;
        }
    }
};