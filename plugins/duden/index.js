module.exports = {
    /*==========[ +INFO+ ]==========*/
    info: {
        description: "Gibt die Definition eines Begriffes aus dem Duden zurück.",
        commands: ["{C}duden <Begriff>", "{N} definiere <Begriff>", "{N} duden <Begriff>"]
    },
    /*==========[ -INFO- ]==========*/

    duden: function(key , callback) {
        var that = this;
        var url = "http://www.duden.de/rechtschreibung/" + encodeURIComponent(key);
        REQUEST(url, function (error, response, body) {
            if(!error) {
                var $ = CHEERIO.load(body);
                if(response.statusCode == 404) {
                    var sug = $('#block-system-main .block-inner .content .spellchecker a').text();
                    if(sug.length === 0) {
                        if(key[0] === key[0].toUpperCase()) {
                            var _key = key.charAt(0).toLowerCase() + key.slice(1);
                            return that.duden(_key, callback);
                        } else {
                            var __key = key.charAt(0).toUpperCase() + key.slice(1);
                            return that.duden(__key, callback);
                        }
                    }
                    else {
                        return callback("Unter dem Begriff \"" + key + "\" wurde nichts gefunden. Meintest du vielleicht \"" + sug + "\" ?");
                    }
                }
                else {
                    var fof = $('.error404');
                    if(fof.length !== 0) {
                        if(key[0] === key[0].toUpperCase()) {
                            var ___key = key.charAt(0).toLowerCase() + key.slice(1);
                            return that.duden(___key, callback);
                        } else {
                            var ____key = key.charAt(0).toUpperCase() + key.slice(1);
                            return that.duden(____key, callback);
                        }
                    }
                    else {
                        var lemma = $('.lemma_zeile .lemma').text();
                        var artikel = $('.artikel').text();
                        var wortart = $('.wortart').text();
                        var content = $('.field-name-field-abstract .content');
                        content.find("a").remove();
                        content = content.text();

                        content = content.replace(/(\r\n|\n|\r)/gm," ");
                        content = content.replace(/\s+/g," ");

                        if(content.length === 1) {
                            return callback(lemma + artikel + ". " + wortart + ". Keine Bedeutung vorhanden.");
                        }
                        else {
                            if(UTIL.endsWith(content, ";")) {
                                content = content.slice(0, -1) + ".";
                            }
                            return callback(lemma + artikel + ". " + wortart + ". " + content);
                        }
                    }
                }
            }
            else return callback(error);
        });
    },
    onCommand: function(client, server, channel, commandChar, name, params, user, text, message) {
        if(name == "duden" || name == "d") {
            if( params.length === 0 ) return client.notice(user.getNick(), commandChar + name + " <Begriff>");
            this.duden(text, function(resp) {
                client.say(channel.getName(), user.getNick() + ": " + resp);
            });
            return true;
        }
    },
    onResponseMessage: function(client, server, channel, user, message) {
        message.rmatch("^(definiere|duden) (.*)", function(match) {
            this.duden(match[2], function(resp) {
                client.say(channel.getName(), user.getNick() + ": " + resp);
            });
        });
    }
};