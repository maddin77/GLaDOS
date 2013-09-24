module.exports = {
    /*==========[ +CONFIG+ ]==========*/
    PORT: process.env.VMC_APP_PORT || 1337,
    CACHE_UPDATE_INTERVAL: 60, //Seconds
    /*==========[ -CONFIG- ]==========*/
    /*==========[ +INFO+ ]==========*/
    info: {
        description: "Bietet Informationen zu Usern und Channeln Online.",
        commands: ["{C}webserver <ENABLE/DISABLE/CACHE>"]
    },
    /*==========[ -INFO- ]==========*/

    CACHE: {
        "channel": null,
        "channel_message": null,
        "join": null,
        "karma": null,
        "kick": null,
        "part": null,
        "private_message": null,
        "quit": null,
        "quiz": null,
        "user": null,

        "time": new Date(),
        "files": {
            "css": null,
            "bootstrapjs": null,
            "dtbootstrap": null,
            "dataTables": null,
            "jquery": null,

            "favicon": null,

            "quiz": null,
            "userlist": null,
            "userinfo": null,
            "karma": null,
            "channellist": null,
            "channelinfo": null,

            "offline": null,
            "fof": null
        }
    },
    intervalID: null,
    active: false,
    fs: require('fs'),
    http: require('http'),
    url: require('url'),
    server: null,
    zlib: require('zlib'),

    setUpServer: function() {
        var that = this;
        this.server = this.http.createServer(function(req, res) {
            var path = that.url.parse(req.url).pathname.split("/"), body = "", buffer = null;
            path.splice(0,1);
            if(path[0] == "favicon.ic") return;
            console.log(path);
            if(!that.active) {
                res.writeHead(200, {'content-encoding': 'gzip','Content-Type': 'text/html'});
                res.write(that.CACHE.files.offline);
                res.end();
            }
            else {
                if(path[0] == "quiz") {
                    body = that.CACHE.files.quiz;
                    body = body.replace(new RegExp("{%css%}", 'g'), that.CACHE.files.css );
                    body = body.replace(new RegExp("{%bootstrapjs%}", 'g'), that.CACHE.files.bootstrapjs );
                    body = body.replace(new RegExp("{%jquery%}", 'g'), that.CACHE.files.jquery );
                    body = body.replace(new RegExp("{%QUIZDATA%}", 'g'), JSON.stringify(that.CACHE.quiz) );
                    body = body.replace(new RegExp("{%TIME%}", 'g'), that.CACHE.time );
                    body = body.replace(new RegExp("{%CACHEDFOR%}", 'g'), that.CACHE_UPDATE_INTERVAL );
                    buffer = new Buffer(body, 'utf8');
                    that.zlib.gzip(buffer, function(err, buf) {
                        if(err) LOG.error("quiz gzip", err);
                        res.writeHead(200, {'content-encoding': 'gzip','Content-Type': 'text/html'});
                        res.write(buf);
                        res.end();
                    });
                }
                else if(path[0] == "karma") {
                    body = that.CACHE.files.karma;
                    body = body.replace(new RegExp("{%css%}", 'g'), that.CACHE.files.css );
                    body = body.replace(new RegExp("{%bootstrapjs%}", 'g'), that.CACHE.files.bootstrapjs );
                    body = body.replace(new RegExp("{%jquery%}", 'g'), that.CACHE.files.jquery );
                    body = body.replace(new RegExp("{%KARMADATA%}", 'g'), JSON.stringify(that.CACHE.karma) );
                    body = body.replace(new RegExp("{%TIME%}", 'g'), that.CACHE.time );
                    body = body.replace(new RegExp("{%CACHEDFOR%}", 'g'), that.CACHE_UPDATE_INTERVAL );
                    buffer = new Buffer(body, 'utf8');
                    that.zlib.gzip(buffer, function(err, buf) {
                        if(err) LOG.error("karma gzip", err);
                        res.writeHead(200, {'content-encoding': 'gzip','Content-Type': 'text/html'});
                        res.write(buf);
                        res.end();
                    });
                }
                else if(path[0] == "user") {
                    if(path.length == 1) {
                        body = that.CACHE.files.userlist;
                        body = body.replace(new RegExp("{%css%}", 'g'), that.CACHE.files.css );
                        body = body.replace(new RegExp("{%bootstrapjs%}", 'g'), that.CACHE.files.bootstrapjs );
                        body = body.replace(new RegExp("{%dataTables%}", 'g'), that.CACHE.files.dataTables );
                        body = body.replace(new RegExp("{%dtbootstrap%}", 'g'), that.CACHE.files.dtbootstrap );
                        body = body.replace(new RegExp("{%jquery%}", 'g'), that.CACHE.files.jquery );
                        body = body.replace(new RegExp("{%USER%}", 'g'), JSON.stringify(that.CACHE.user) );
                        body = body.replace(new RegExp("{%TIME%}", 'g'), that.CACHE.time );
                        body = body.replace(new RegExp("{%CACHEDFOR%}", 'g'), that.CACHE_UPDATE_INTERVAL );
                        buffer = new Buffer(body, 'utf8');
                        that.zlib.gzip(buffer, function(err, buf) {
                            if(err) LOG.error("userlist gzip", err);
                            res.writeHead(200, {'content-encoding': 'gzip','Content-Type': 'text/html'});
                            res.write(buf);
                            res.end();
                        });
                    }
                    else {
                        var user = decodeURIComponent(path[1]);
                        body = that.CACHE.files.userinfo;
                        body = body.replace(new RegExp("{%css%}", 'g'), that.CACHE.files.css );
                        body = body.replace(new RegExp("{%bootstrapjs%}", 'g'), that.CACHE.files.bootstrapjs );
                        body = body.replace(new RegExp("{%dataTables%}", 'g'), that.CACHE.files.dataTables );
                        body = body.replace(new RegExp("{%dtbootstrap%}", 'g'), that.CACHE.files.dtbootstrap );
                        body = body.replace(new RegExp("{%jquery%}", 'g'), that.CACHE.files.jquery );
                        body = body.replace(new RegExp("{%TIME%}", 'g'), that.CACHE.time );
                        body = body.replace(new RegExp("{%CACHEDFOR%}", 'g'), that.CACHE_UPDATE_INTERVAL );


                        DATABASE.query("SELECT * FROM `user` WHERE `nick` = ?;SELECT * FROM `channel_message` WHERE `nick` = ?;SELECT * FROM `join` WHERE `nick` = ?;SELECT * FROM `kick` WHERE `nick` = ? OR `by` = ?;SELECT * FROM `part` WHERE `nick` = ?;SELECT * FROM `quit` WHERE `nick` = ?;SELECT `value` FROM `quiz` WHERE `nick` = ?;SELECT `value` FROM `karma` WHERE `nick` = ?",[user,user,user,user,user,user,user,user,user], function(err, results) {
                            body = body.replace(new RegExp("{%INFO%}", 'g'), JSON.stringify(results[0][0]) );
                            body = body.replace(new RegExp("{%CHANMSG%}", 'g'), JSON.stringify(results[1]) );
                            body = body.replace(new RegExp("{%JOINS%}", 'g'), JSON.stringify(results[2]) );
                            body = body.replace(new RegExp("{%KICKS%}", 'g'), JSON.stringify(results[3]) );
                            body = body.replace(new RegExp("{%PARTS%}", 'g'), JSON.stringify(results[4]) );
                            body = body.replace(new RegExp("{%QUITS%}", 'g'), JSON.stringify(results[5]) );
                            body = body.replace(new RegExp("{%QUIZVALUE%}", 'g'), JSON.stringify(results[6].length === 0 ? 0 : results[6][0].value) );
                            body = body.replace(new RegExp("{%KARMAVALUE%}", 'g'), JSON.stringify(results[7].length === 0 ? 0 : results[7][0].value) );
                            buffer = new Buffer(body, 'utf8');
                            that.zlib.gzip(buffer, function(err, buf) {
                                if(err) LOG.error("channel gzip", err);
                                res.writeHead(200, {'content-encoding': 'gzip','Content-Type': 'text/html'});
                                res.write(buf);
                                res.end();
                            });
                        });
                    }
                }
                else if(path[0] == "channel") {
                    if(path.length == 1) {
                        body = that.CACHE.files.channellist;
                        body = body.replace(new RegExp("{%css%}", 'g'), that.CACHE.files.css );
                        body = body.replace(new RegExp("{%bootstrapjs%}", 'g'), that.CACHE.files.bootstrapjs );
                        body = body.replace(new RegExp("{%dataTables%}", 'g'), that.CACHE.files.dataTables );
                        body = body.replace(new RegExp("{%dtbootstrap%}", 'g'), that.CACHE.files.dtbootstrap );
                        body = body.replace(new RegExp("{%jquery%}", 'g'), that.CACHE.files.jquery );
                        body = body.replace(new RegExp("{%CHANNEL%}", 'g'), JSON.stringify(that.CACHE.channel) );
                        body = body.replace(new RegExp("{%TIME%}", 'g'), that.CACHE.time );
                        body = body.replace(new RegExp("{%CACHEDFOR%}", 'g'), that.CACHE_UPDATE_INTERVAL );
                        buffer = new Buffer(body, 'utf8');
                        that.zlib.gzip(buffer, function(err, buf) {
                            if(err) LOG.error("channellist gzip", err);
                            res.writeHead(200, {'content-encoding': 'gzip','Content-Type': 'text/html'});
                            res.write(buf);
                            res.end();
                        });
                    }
                    else {
                        var channel = decodeURIComponent("#"+path[1]);
                        body = that.CACHE.files.channelinfo;
                        body = body.replace(new RegExp("{%css%}", 'g'), that.CACHE.files.css );
                        body = body.replace(new RegExp("{%bootstrapjs%}", 'g'), that.CACHE.files.bootstrapjs );
                        body = body.replace(new RegExp("{%dataTables%}", 'g'), that.CACHE.files.dataTables );
                        body = body.replace(new RegExp("{%dtbootstrap%}", 'g'), that.CACHE.files.dtbootstrap );
                        body = body.replace(new RegExp("{%jquery%}", 'g'), that.CACHE.files.jquery );
                        body = body.replace(new RegExp("{%TIME%}", 'g'), that.CACHE.time );
                        body = body.replace(new RegExp("{%CACHEDFOR%}", 'g'), that.CACHE_UPDATE_INTERVAL );
                        DATABASE.query("SELECT * FROM `channel` WHERE `name` = ?;SELECT * FROM `channel_message` WHERE `channel` = ?;SELECT * FROM `join` WHERE `channel` = ?;SELECT * FROM `kick` WHERE `channel` = ?;SELECT * FROM `part` WHERE `channel` = ?",[channel,channel,channel,channel,channel], function(err, results) {
                            body = body.replace(new RegExp("{%INFO%}", 'g'), JSON.stringify(results[0][0]) );
                            body = body.replace(new RegExp("{%CHANMSG%}", 'g'), JSON.stringify(results[1]) );
                            body = body.replace(new RegExp("{%JOINS%}", 'g'), JSON.stringify(results[2]) );
                            body = body.replace(new RegExp("{%KICKS%}", 'g'), JSON.stringify(results[3]) );
                            body = body.replace(new RegExp("{%PARTS%}", 'g'), JSON.stringify(results[4]) );
                            buffer = new Buffer(body, 'utf8');
                            that.zlib.gzip(buffer, function(err, buf) {
                                if(err) LOG.error("channel gzip", err);
                                res.writeHead(200, {'content-encoding': 'gzip','Content-Type': 'text/html'});
                                res.write(buf);
                                res.end();
                            });
                        });
                    }
                }
                else {
                    res.writeHead(404, {'content-encoding': 'gzip','Content-Type': 'text/html'});
                    res.write(that.CACHE.files.fof);
                    res.end();
                }
            }
        });
        this.server.listen(this.PORT);
    },

    updateCache: function() {
        var that = this;
        DATABASE.query("SELECT * FROM `channel`", function(err, results) {
            that.CACHE.channel = results;
        });
        DATABASE.query("SELECT * FROM `channel_message`", function(err, results) {
            that.CACHE.channel_message = results;
        });
        DATABASE.query("SELECT * FROM `join`", function(err, results) {
            that.CACHE.join = results;
        });
        DATABASE.query("SELECT * FROM `karma`", function(err, results) {
            that.CACHE.karma = results;
        });
        DATABASE.query("SELECT * FROM `kick`", function(err, results) {
            that.CACHE.kick = results;
        });
        DATABASE.query("SELECT * FROM `part`", function(err, results) {
            that.CACHE.part = results;
        });
        /*DATABASE.query("SELECT * FROM `private_message`", function(err, results) {s
            that.private_message = results;
        });*/
        DATABASE.query("SELECT * FROM `quit`", function(err, results) {
            that.CACHE.quit = results;
        });
        DATABASE.query("SELECT * FROM `quiz`", function(err, results) {
            that.CACHE.quiz = results;
        });
        DATABASE.query("SELECT * FROM `user`", function(err, results) {
            that.CACHE.user = results;
        });

        this.fs.readFile('plugins/webserver/files/css/style.css', {encoding: "utf8"}, function (err, css) {
            that.CACHE.files.css = css+"";
        });
        this.fs.readFile('plugins/webserver/files/js/jquery.min.js', {encoding: "utf8"}, function (err, jquery) {
            that.CACHE.files.jquery = jquery+"";
        });
        this.fs.readFile('plugins/webserver/files/js/bootstrap.min.js', {encoding: "utf8"}, function (err, bootstrapjs) {
            that.CACHE.files.bootstrapjs = bootstrapjs+"";
        });
        this.fs.readFile('plugins/webserver/files/js/jquery.dataTables.min.js', {encoding: "utf8"}, function (err, dataTables) {
            that.CACHE.files.dataTables = dataTables+"";
        });
        this.fs.readFile('plugins/webserver/files/js/DT_bootstrap.js', {encoding: "utf8"}, function (err, dtbootstrap) {
            that.CACHE.files.dtbootstrap = dtbootstrap+"";
        });

        this.fs.readFile('plugins/webserver/files/offline.html', {encoding: "utf8"}, function (err, body) {
            var buf = new Buffer(body, 'utf8');
            that.zlib.gzip(buf, function(err, buffer) {
                if(err) LOG.error("offline gzip", err);
                that.CACHE.files.offline = buffer;
            });
        });
        this.fs.readFile('plugins/webserver/files/404.html', {encoding: "utf8"}, function (err, body) {
            var buf = new Buffer(body, 'utf8');
            that.zlib.gzip(buf, function(err, buffer) {
                if(err) LOG.error("fof gzip", err);
                that.CACHE.files.fof = buffer;
            });
        });
        this.fs.readFile('plugins/webserver/files/quiz.html', {encoding: "utf8"}, function (err, quiz) {
            that.CACHE.files.quiz = quiz+"";
        });
        this.fs.readFile('plugins/webserver/files/user-list.html', {encoding: "utf8"}, function (err, userlist) {
            that.CACHE.files.userlist = userlist+"";
        });
        this.fs.readFile('plugins/webserver/files/user.html', {encoding: "utf8"}, function (err, userinfo) {
            that.CACHE.files.userinfo = userinfo+"";
        });
        this.fs.readFile('plugins/webserver/files/karma.html', {encoding: "utf8"}, function (err, karma) {
            that.CACHE.files.karma = karma+"";
        });
        this.fs.readFile('plugins/webserver/files/channel-list.html', {encoding: "utf8"}, function (err, channellist) {
            that.CACHE.files.channellist = channellist+"";
        });
        this.fs.readFile('plugins/webserver/files/channel.html', {encoding: "utf8"}, function (err, channelinfo) {
            that.CACHE.files.channelinfo = channelinfo+"";
        });

        this.CACHE.time = new Date();
    },

    onCommand: function(client, server, channel, commandChar, name, params, user, text, message) {
        if(name == "webserver") {
            console.log(this.server.address());
            if(!user.hasPermissions()) return client.notice(user.getNick(), "Du hast nicht die nötigen rechte dazu.");
            if(params.length === 0) return client.notice(user.getNick(), commandChar + name + " <ENABLE/DISABLE/CACHE>");
            if(params[0].toLowerCase() == "enable") {
                this.active = true;
                return client.notice(user.getNick(), "Webserver enabled.");
            }
            else if(params[0].toLowerCase() == "disable") {
                this.active = false;
                return client.notice(user.getNick(), "Webserver disabled.");
            }
            else if(params[0].toLowerCase() == "cache") {
                if(params.length === 1) return client.notice(user.getNick(), commandChar + name + " CACHE <Seconds>");
                var num = parseInt(params[1],10);
                if(isNaN(num)) return client.notice(user.getNick(), commandChar + name + " CACHE <Seconds>");
                clearInterval(this.intervalID);
                this.CACHE_UPDATE_INTERVAL = num;
                this.updateCache();
                var that = this;
                this.intervalID = setInterval(function() {
                    that.updateCache();
                }, this.CACHE_UPDATE_INTERVAL*1000);
            }
            else return client.notice(user.getNick(), commandChar + name + " <ENABLE/DISABLE/CACHE>");
        }
    },
    onLoad: function() {
        var that = this;
        this.intervalID = setInterval(function() {
            that.updateCache();
        }, this.CACHE_UPDATE_INTERVAL*1000);
        this.updateCache();
        this.setUpServer();
        this.active = true;
    },
    onUnLoad: function() {
        this.active = false;
        this.server.close(function() {
            console.log("close");
        });
    }
};