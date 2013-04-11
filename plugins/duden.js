module.exports = {
    onCommand: function(client, server, channel, commandChar, name, params, user, text, message) {
        if(name == "duden" || name == "d") {
            if( params.length === 0 ) return client.notice(user.getNick(), commandChar + name + " <Text>");
            var url = "http://www.duden.de/rechtschreibung/" + encodeURIComponent(text);
            REQUEST(url, function (error, response, body) {
                if(!error) {
                    var $ = CHEERIO.load(body);
                    if(response.statusCode == 404) {
                        var sug = $('#block-system-main .block-inner .content .spellchecker a').text();
                        if(sug.length === 0) {
                            client.say(channel.getName(), user.getNick() + ": Unter dem Begriff \"" + text + "\" wurde nichts gefunden.");
                        }
                        else {
                            client.say(channel.getName(), user.getNick() + ": Unter dem Begriff \"" + text + "\" wurde nichts gefunden. Meintest du vielleicht \"" + sug + "\" ?");
                        }
                    }
                    else {
                        var fof = $('.error404');
                        if(fof.length !== 0) {
                            client.say(channel.getName(), user.getNick() + ": Unter dem Begriff \"" + text + "\" wurde nichts gefunden.");
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
                                client.say(channel.getName(), user.getNick() + ": " + lemma + artikel + ". " + wortart + ". Keine Bedeutung vorhanden.");
                            }
                            else {
                                if(UTIL.endsWith(content, ";")) {
                                    content = content.slice(0, -1) + ".";
                                }
                                client.say(channel.getName(), user.getNick() + ": " + lemma + artikel + ". " + wortart + ". " + content);
                            }
                        }
                    }
                }
            });
        }
    },
    onResponseMessage: function(client, server, channel, user, message) {
        message.rmatch("^(definiere|duden) (.*)", function(match) {
            var url = "http://www.duden.de/rechtschreibung/" + encodeURIComponent(match[2]);
            REQUEST(url, function (error, response, body) {
                if(!error) {
                    var $ = CHEERIO.load(body);
                    if(response.statusCode == 404) {
                        var sug = $('#block-system-main .block-inner .content .spellchecker a').text();
                        if(sug.length === 0) {
                            client.say(channel.getName(), user.getNick() + ": Unter dem Begriff \"" + def + "\" wurde nichts gefunden.");
                        }
                        else {
                            client.say(channel.getName(), user.getNick() + ": Unter dem Begriff \"" + def + "\" wurde nichts gefunden. Meintest du vielleicht \"" + sug + "\" ?");
                        }
                    }
                    else {
                        var fof = $('.error404');
                        if(fof.length !== 0) {
                            client.say(channel.getName(), user.getNick() + ": Unter dem Begriff \"" + def + "\" wurde nichts gefunden.");
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
                                client.say(channel.getName(), user.getNick() + ": " + lemma + artikel + ". " + wortart + ". Keine Bedeutung vorhanden.");
                            }
                            else {
                                if(UTIL.endsWith(content, ";")) {
                                    content = content.slice(0, -1) + ".";
                                }
                                client.say(channel.getName(), user.getNick() + ": " + lemma + artikel + ". " + wortart + ". " + content);
                            }
                        }
                    }
                }
            });
        });
    }
};