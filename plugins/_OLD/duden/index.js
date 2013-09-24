module.exports = {
    /*==========[ +INFO+ ]==========*/
    info: {
        description: "Gibt die Definition eines Begriffes aus dem Duden zurück.",
        commands: ["{C}d <Begriff>", "{C}duden <Begriff>"]
    },
    /*==========[ -INFO- ]==========*/

    /*duden: function(key , callback) {
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
    },*/
    duden: function(key , callback) {
        var that = this;
        var url = "http://de.thefreedictionary.com/" + encodeURIComponent(key);
        console.log(url);
        REQUEST(url, function (error, response, body) {
            if(!error) {
                var $ = CHEERIO.load(body);
                var MainTxt = $('#MainTxt');
                MainTxt.remove('script');
                if( MainTxt.length === 0 ) {
                    var c = $('#ContentTable').find('tr td:nth-child(2) div');
                    c.find('form').remove();
                    var text = c.text();
                    text = text.replace(/(\r\n|\n|\r)/gm," ");
                    text = text.replace(/\s+/g," ");
                    var table = c.find('table').text();
                    if(table.length === 0) {
                        console.log(1);
                        text = text.replace(":", ": ");
                        return callback(text);
                    }
                    else {
                        var words = [];
                        c.find('table td').each(function(i,e) {
                            var w = $(this).text();
                            if(w.length > 0) {
                                words.push( w );
                            }
                        });
                        text = text.split(":")[0] + " vielleicht: " + words.join(", ") + "?";
                        return callback(text);
                    }
                    console.log("======================================");
                }
                else {
                    MainTxt.find('script').replaceWith("");
                    MainTxt.find('br').replaceWith("=======================");
                    MainTxt.find('hr').replaceWith("=======================");
                    var text = MainTxt.text().split("=======================")[0];
                    text = text.replace(/(\r\n|\n|\r)/gm," ");
                    text = text.replace(/\s+/g," ");
                    if(text[0] == " ") {
                        text = text.slice( 1 );
                    }
                    if(text[text.length-1] != ".") {
                        text += ".";
                    }
                    console.log( '"'+text+'"' );
                    return callback(text);
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
    }
};