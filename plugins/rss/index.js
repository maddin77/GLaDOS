module.exports = {
    /*==========[ +INFO+ ]==========*/
    info: {
        description: "",
        commands: ["{C}rss <LIST/ADD/SUB(SCRIBE)/UNSUB(SCRIBE)> [...]"]
    },
    /*==========[ -INFO- ]==========*/
    feeds: {},
    intervalID: -1,
    intervalTime: 10000,
    channel: "#rss",

    checkFeeds: function(first) {
        //LOG.debug("checkFeeds");
        for(var feedShort in this.feeds) {
            this.requestFeed(feedShort, this.feeds[feedShort].url, this.feeds[feedShort].subs, first);
        }
    },

    requestFeed: function(fshort, url, subs, first) {
        var that = this;
        if(subs.lenght === 0) return;
        REQUEST(url, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var $ = CHEERIO.load(body, {xmlMode: true});
                that.feeds[fshort].name = $('channel > description').text();
                $('item').each(function(index, element) {
                    if(index > 4) return false;
                    var url = $(this).find('guid').text();
                    if(that.feeds[fshort].readed.indexOf(url) == -1) {
                        var title = $(this).find('title').text();
                        var nSubs = [];
                        for(var i=0; i<subs.length; i++) {
                            if( SERVER.getChannel(that.channel).userExistInChannel(subs[i]) ) {
                                nSubs.push( subs[i] );
                            }
                        }
                        if(!first && nSubs.length > 0) {
                            CLIENT.say(that.channel, "[" + fshort + "] " + nSubs.join(", ") + ": " + title + " (" + url + ")");
                        }
                        that.feeds[fshort].readed.push(url);
                    }
                });
            }
        });
    },
    removeSubscription: function(fshort, nick) {
        var i = this.feeds[ fshort ].subs.indexOf( nick );
        if( i != -1 ) {
            this.feeds[ fshort ].subs.splice(i, 1);
        }
    },
    addSubscription: function(fshort, nick) {
        if( this.feeds[ fshort ].subs.indexOf( nick ) == -1 ) {
            this.feeds[ fshort ].subs.push(nick);
        }
    },
    isSubscribed: function(fshort, nick) {
        return this.feeds[ fshort ].subs.indexOf( nick ) != -1;
    },
    feedExist: function(fshort) {
        return this.feeds.hasOwnProperty(fshort);
    },
    onCommand: function(client, server, channel, commandChar, name, params, user, text, message) {
        if(name == "rss") {
            this.save();
            if(params.length === 0) return client.notice(user.getNick(), commandChar + name + " <LIST/ADD/SUB(SCRIBE)/UNSUB(SCRIBE)> [...]");
            if(params[0].toLowerCase() == "add") {
                if(!user.hasPermissions()) return client.notice(user.getNick(), "Du hast nicht die nötigen Rechte dazu.");
                if(params.length < 3) return client.notice(user.getNick(), commandChar + name + " ADD <short> <url>");
                that.feeds[ params[1] ] = {
                    "name": params[1],
                    "url": params[2],
                    "subs": [],
                    "readed": []
                };
                this.save();
                return true;
            }
            else if(params[0].toLowerCase() == "sub" || params[0].toLowerCase() == "subscribe") {
                if(params.length < 2) {
                    client.notice(user.getNick(), "The following Channels are available:");
                    var ex = "";
                    for(var feedShort in this.feeds) {
                        ex = feedShort;
                        client.notice(user.getNick(), "[" + feedShort + "] " + this.feeds[feedShort].name + " <" + this.feeds[feedShort].url + ">");
                    }
                    return client.notice(user.getNick(), commandChar + name + " SUBSCRIBE <short, eg: " + ex + ">");
                }
                if(!this.feedExist(params[1])) return client.notice(user.getNick(), "No feed with the short '"+params[1]+"' found. Use '"+commandChar + name + " SUBSCRIBE' to get a list of available feeds.");
                if(!this.isSubscribed(params[1], user.getNick())) return client.notice(user.getNick(), "You already subscribed to that feed. If you want to unsubscribe, use '"+commandChar + name + " UNSUBSCRIBE "+params[1]+"' instead.");
                this.addSubscription(params[1], user.getNick());
                client.notice(user.getNick(), "You successfully subscribed to the feed '"+params[1]+"'.");
                this.save();
                return true;
            }
            else if(params[0].toLowerCase() == "unsub" || params[0].toLowerCase() == "unsubscribe") {
                if(params.length < 2) {
                    client.notice(user.getNick(), "You are subscribed to he following Channels:");
                    var ex2 = "";
                    for(var feedShort2 in this.feeds) {
                        ex2 = feedShort2;
                        if( this.feeds[ feedShort2 ].subs.indexOf(user.getNick()) != -1 ) {
                            client.notice(user.getNick(), "[" + feedShort2 + "] " + this.feeds[feedShort2].name + " <" + this.feeds[feedShort2].url + ">");
                        }
                    }
                    return client.notice(user.getNick(), commandChar + name + " UNSUBSCRIBE <short, eg: " + ex2 + ">");
                }
                if(!this.feedExist(params[1])) return client.notice(user.getNick(), "No feed with the short '"+params[1]+"' found. Use '"+commandChar + name + " UNSUBSCRIBE' to get a list of available feeds.");
                if(!this.isSubscribed(params[1], nick)) return client.notice(user.getNick(), "You are not subscribed to that feed. If you want to subscribe, use '"+commandChar + name + " SUBSCRIBE "+params[1]+"' instead.");
                this.removeSubscription(params[1], user.getNick());
                client.notice(user.getNick(), "You successfully unsubscribed from the feed '"+params[1]+"'.");
                this.save();
                return true;
            }
            else if(params[0].toLowerCase() == "list") {
                client.notice(user.getNick(), "The following Channels are available:");
                for(var feedShort3 in this.feeds) {
                    client.notice(user.getNick(), "[" + feedShort3 + "] " + this.feeds[feedShort3].name + " <" + this.feeds[feedShort3].url + ">");
                }
            }
            else return client.notice(user.getNick(), commandChar + name + " <LIST/ADD/SUB(SCRIBE)/UNSUB(SCRIBE)> [...]");
        }
    },

    save: function() {
        var usr = {};
        for(var feedShort in this.feeds) {
            DATABASE.query("INSERT IGNORE INTO `rss_channel` VALUES (?,?,?)", [this.feeds[feedShort].name, feedShort, this.feeds[feedShort].url]);
            for(var i=0; i<this.feeds[feedShort].subs.length; i++) {
                var nick = this.feeds[feedShort].subs[i];
                if(!usr.hasOwnProperty( nick )) {
                    usr[ nick ] = [];
                }
                usr[ nick ].push(feedShort);
            }
        }
        for(var n in usr) {
            DATABASE.query("INSERT INTO `rss_subscription` VALUES (?,?) ON DUPLICATE KEY UPDATE `feeds` = ?", [n, usr[n].join(","), usr[n].join(",")]);
        }
    },

    onUnload: function() {
        clearInterval(this.intervalID);
        this.save();
    },

    onLoad: function() {
        DATABASE.query("CREATE TABLE IF NOT EXISTS `rss_channel` (`name` varchar(255) COLLATE utf8_bin NOT NULL DEFAULT '',`short` varchar(255) COLLATE utf8_bin DEFAULT NULL,`url` varchar(255) COLLATE utf8_bin DEFAULT NULL,PRIMARY KEY (`name`)) ENGINE=InnoDB DEFAULT CHARSET=utf8;");
        DATABASE.query("INSERT IGNORE INTO `rss_channel` VALUES ('IT-News fuer Profis', 'golem', 'http://rss.golem.de/rss.php');");
        DATABASE.query("INSERT IGNORE INTO `rss_channel` VALUES ('Nachrichten nicht nur aus der Welt der Computer', 'heise', 'http://heise.de.feedsportal.com/c/35207/f/653901/index.rss');");
        DATABASE.query("INSERT IGNORE INTO `rss_channel` VALUES ('San Andreas Multiplayer - Deutsches Forum', 'samp.de', 'http://forum.sa-mp.de/?page=ThreadsFeed&format=rss2');");
        DATABASE.query("INSERT IGNORE INTO `rss_channel` VALUES ('gulli:News', 'gulli', 'http://ticker.gulli.com/rss');");
        DATABASE.query("CREATE TABLE IF NOT EXISTS `rss_subscription` (`nick` varchar(255) NOT NULL DEFAULT '',`feeds` varchar(255) DEFAULT NULL,PRIMARY KEY (`nick`)) ENGINE=InnoDB DEFAULT CHARSET=utf8;");
        var that = this;
        DATABASE.query("SELECT * FROM `rss_channel`", function(err, results) {
            if(err) {
                console.error(err);
                QUIT(1);
            }
            else {
                for(var i=0; i<results.length; i++) {
                    that.feeds[ results[i].short ] = {
                        "name": results[i].name,
                        "url": results[i].url,
                        "subs": [],
                        "readed": []
                    };
                }

                DATABASE.query("SELECT * FROM `rss_subscription`", function(err2, results2) {
                    if(err2) {
                        console.error(err2);
                        QUIT(1);
                    }
                    else {
                        for(var i=0; i<results2.length; i++) {
                            var feeds = results2[i].feeds.split(",");
                            for(var j=0; j<feeds.length; j++) {
                                if(that.feeds.hasOwnProperty(feeds[j])) {
                                    that.feeds[ feeds[j] ].subs.push( results2[i].nick );
                                }
                            }
                        }
                        //console.log(that.feeds);
                        that.intervalID = setInterval(function() {
                            that.checkFeeds(false);
                        }, that.intervalTime);
                        that.checkFeeds(true);
                    }
                });
            }
        });
    }
};