module.exports = {
    onCommand: function(client, server, channel, commandChar, name, params, user, text, message) {
        if(name == "md5lookup") {
            if( params.length === 0 ) return client.notice(user.getNick(), commandChar + name + " <Hash>");
            var url = "http://md5.noisette.ch/md5.php?hash=" + encodeURIComponent(text);
            REQUEST(url, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    var $ = CHEERIO.load(body);
                    if($('md5lookup').find('error').length > 0) {
                        client.say(channel.getName(), user.getNick() + ": md5lookup von " + text + " ist nicht vorhanden.");
                    }
                    else {
                        client.say(channel.getName(), user.getNick() + ": md5lookup von " + $('hash').text() + " ist \"" + $('string').text() + "\"");
                    }
                }
            });
        }
        else if(name == "hash") {
            if( params.length < 2 ) return client.notice(user.getNick(), commandChar + name + " <md5/sha1/sha256/sha512> <Text>");

            var method = params[0];
            if(method != "md5" && method != "sha1" && method != "sha256" && method != "sha512") return client.notice(cmd.user.getNick(), commandChar + name + " <md5/sha1/sha256/sha512> <Text>");

            var _text = message.substr(method.length+1);

            var sum = CRYPTO.createHash(method);
            sum.update(_text);
            var res = sum.digest('hex');
            client.say(channel.getName(), user.getNick() + ": " + method + " von \"" + _text + "\" ist " + res + "");
        }
    },
    onResponseMessage: function(client, server, channel, user, message) {
        message.rmatch("^(md5lookup von|md5lookup) (.*)", function(match) {
            var url = "http://md5.noisette.ch/md5.php?hash=" + encodeURIComponent(match[2]);
            REQUEST(url, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    var $ = CHEERIO.load(body);
                    if($('md5lookup').find('error').length > 0) {
                        client.say(channel.getName(), user.getNick() + ": md5lookup von " + match[2] + " ist nicht vorhanden.");
                    }
                    else {
                        client.say(channel.getName(), user.getNick() + ": md5lookup von " + $('hash').text() + " ist \"" + $('string').text() + "\"");
                    }
                }
            });
        });
        message.rmatch("^(md5 von|sha von|sha1 von|sha256 von|sha512 von|rmd160 von|md5|sha|sha1|sha256|sha512|rmd160) (.*)", function(match) {
            var method = match[1].split(" ")[0];
            var sum = CRYPTO.createHash(method);
            sum.update(match[2]);
            var res = sum.digest('hex');
            client.say(channel.getName(), user.getNick() + ": " + method + " von \"" + match[2] + "\" ist " + res + "");
        });
    }
};