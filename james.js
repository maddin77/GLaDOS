/* TODO */
//-

/* NODE-MODULES
   ============================= */
IRC     = require('irc');
REQUEST = require('request');
CRYPTO  = require('crypto');
CHEERIO = require('cheerio');
MOMENT  = require('moment');
MYSQL   = require('mysql');
EXPRESS = require('express');

/* LIBS
   ============================= */
CONFIG  = require('nconf');
CONFIG.file('', {json_spacing: 4, file: './config/config.json'});

LOG     = require('./lib/logging.js');
DATABASE= MYSQL.createConnection(CONFIG.get('mysql'));
DATABASE.connect(function(err) {
    if(err) {
        LOG.error("[MySQL] " + err);
        if(err.fatal) {
            LOG.error("Shutting down.");
            QUIT(1);
        }
    }
    else {
        DATABASE.query("CREATE TABLE IF NOT EXISTS `channel` (`name` varchar(255) NOT NULL DEFAULT '',`userCount` int(11) DEFAULT NULL,`topic` varchar(255) DEFAULT NULL,`modes` varchar(255) DEFAULT NULL,PRIMARY KEY (`name`)) ENGINE=InnoDB DEFAULT CHARSET=utf8;");
        DATABASE.query("CREATE TABLE IF NOT EXISTS `user` (`nick` varchar(255) NOT NULL DEFAULT '',`userName` varchar(255) DEFAULT NULL,`host` varchar(255) DEFAULT NULL,`server` varchar(255) DEFAULT NULL,`realName` varchar(255) DEFAULT NULL,`inChannels` varchar(255) DEFAULT NULL,`account` varchar(255) DEFAULT NULL,`idle` int(11) DEFAULT NULL,PRIMARY KEY (`nick`)) ENGINE=InnoDB DEFAULT CHARSET=utf8;");
    }
});
Server  = require('./lib/server.js');
Channel = require('./lib/channel.js');
User    = require('./lib/user.js');
UTIL    = require('./lib/util.js');
PLUGINS = require('./lib/plugins.js');

/* GLOBAL SETTINGS
   ============================= */
MOMENT.lang("de");
SERVER  = new Server(CONFIG.get('irc:server'));
CLIENT  = new IRC.Client(CONFIG.get('irc:server'), CONFIG.get('irc:nick'), CONFIG.get('irc'));

QUIT = function(code) {
    PLUGINS.unloadAll();
    CLIENT.disconnect( CONFIG.get('quitMSG') );
    try {
        DATABASE.end();
    } catch(e) {}
    setTimeout(function() {
        process.exit(code);
    }, 1000);
};
process.on('uncaughtException', function(err) {
    LOG.error("Caught exception: "+ err);
    LOG.error("Shutting down.");
    QUIT(1);
});

CLIENT.addListener('registered', function(message) {
    LOG.log('[{@green}%s{@reset}] %s', CONFIG.get('irc:server'), message.args.join(' '));
});

CLIENT.addListener('motd', function(motd) {
    LOG.log('[{@green}%s{@reset}] %s', CONFIG.get('irc:server'), motd);
    SERVER.setMotd(motd);
    CLIENT.notice("NickServ", "identify " + CONFIG.get('irc:password'));
    CLIENT.list();
});

CLIENT.addListener('names', function(channel, nicks) {
    var nickList = "";
    var _channel = SERVER.getChannel(channel);
    for (var nick in nicks) {
        if(nicks[nick] == "~" || nicks[nick] == "&" || nicks[nick] == "@" || nicks[nick] == "%" || nicks[nick] == "+") {
            _channel.addUserMode(nick, nicks[nick]);
        }
        nickList += (nicks[nick] + nick) + ", ";
        CLIENT.whois(nick);
    }
    nickList = nickList.substr(0, nickList.length-2);
    LOG.log('[{@cyan}%s{@reset}] User im Channel: %s', channel, nickList);
});

CLIENT.addListener('topic', function(channel, topic, nick, message) {
    var _channel = SERVER.getChannel(channel);
    var date = new Date(message.args[3]*1000);
    _channel.setTopic({
        "nick": nick,
        "topic": topic,
        "time": date
    });
    LOG.log('[{@cyan}%s{@reset}] Topic: %s', channel, topic);
    LOG.log('[{@cyan}%s{@reset}] Topic wurde von %s gesetzt. (%s)', channel, nick, date.toString());
    for(var p in PLUGINS.plugins) {
        var pl = PLUGINS.plugins[p];
        if(typeof pl.onTopic !== 'undefined' && !PLUGINS.isDisabled(p, _channel.getName())) {
            pl.onTopic(CLIENT, SERVER, _channel, topic, nick, date);
        }
    }
});

CLIENT.addListener('join', function(channel, nick, message) {
    LOG.log('[{@cyan}%s{@reset}] %s hat den Channel betreten', channel, nick);
    var _channel = SERVER.getChannel(channel);
    var user = SERVER.getUser(nick);
    if(nick != CONFIG.get('irc:nick')) {
        CLIENT.whois(nick);
    }
    for(var p in PLUGINS.plugins) {
        var pl = PLUGINS.plugins[p];
        if(typeof pl.onJoin !== 'undefined' && !PLUGINS.isDisabled(p, _channel.getName())) {
            pl.onJoin(CLIENT, SERVER, _channel, user);
        }
    }
});

CLIENT.addListener('part', function(channel, nick, reason, message) {
    LOG.log('[{@cyan}%s{@reset}] %s hat den Channel verlassen (%s)', channel, nick, reason);
    var _channel = SERVER.getChannel(channel);
    var user = SERVER.getUser(nick);

    for(var p in PLUGINS.plugins) {
        var pl = PLUGINS.plugins[p];
        if(typeof pl.onPart !== 'undefined' && !PLUGINS.isDisabled(p, _channel.getName())) {
            pl.onPart(CLIENT, SERVER, _channel, user, reason);
        }
    }
});

CLIENT.addListener('quit', function(nick, reason, channels, message) {
    LOG.log('%s hat den Server verlassen (%s)', nick, reason);
    var user = SERVER.getUser(nick);
    user.setOffline();
    for(var p in PLUGINS.plugins) {
        var pl = PLUGINS.plugins[p];
        if(typeof pl.onQuit !== 'undefined') {
            pl.onQuit(CLIENT, SERVER, user, reason);
        }
    }
});

CLIENT.addListener('kick', function(channel, nick, by, reason, message) {
    LOG.log('[{@cyan}%s{@reset}] %s wurde von %s aus dem Channel geworfen. Grund: %s', channel, nick, by, reason);
    if( typeof reason == 'undefined' ) {
        reason = "";
    }
    var _channel = SERVER.getChannel(channel);
    var user = SERVER.getUser(nick);
    var byUser = SERVER.getUser(by);
    for(var p in PLUGINS.plugins) {
        var pl = PLUGINS.plugins[p];
        if(typeof pl.onKick !== 'undefined' && !PLUGINS.isDisabled(p, _channel.getName())) {
            pl.onKick(CLIENT, SERVER, _channel, user, byUser, reason);
        }
    }
});

CLIENT.addListener('kill', function(nick, reason, channels, message) {
    LOG.log('[{@cyan}%s{@reset}] %s hat den unfreiwillig Server verlassen (%s)', channel, nick, reason);
    var user = SERVER.getUser(nick);
    user.setOffline();
});

CLIENT.addListener('message', function(nick, to, text, message) {
    var user = SERVER.getUser(nick);
    if( to === CONFIG.get('irc:nick') ) {
        LOG.log('[{@red}PN{@reset}] %s: %s', nick, text);
        if(text.split(" ")[0].toLowerCase() == "help") {
            var parts = text.split(" ");
            if(parts.length == 1) {
                CLIENT.say(nick, "***** " + CONFIG.get('irc:nick') + " Help *****");
                CLIENT.say(nick, "Ich bin ein Bot und reagiere auf bestimmte Befehle bzw. Interaktionen im Channel.");
                CLIENT.say(nick, " ");
                CLIENT.say(nick, "Für mehr Informationen zu meinen Funktionen, benutze:");
                CLIENT.say(nick, "/msg " + CONFIG.get('irc:nick') + " HELP <plugin>");
                CLIENT.say(nick, " ");
                CLIENT.say(nick, "Folgende Plugins sind installiert:");
                CLIENT.say(nick, PLUGINS.getAllAsString(", "));
                CLIENT.say(nick, "***** " + CONFIG.get('irc:nick') + " Help *****");
            }
            else {
                if(!PLUGINS.exist(parts[1])) {
                    CLIENT.say(nick, "Für das Plugin " + parts[1] + " ist keine Hilfe verfügbar.");
                }
                else {
                    var pl_ = PLUGINS.plugins[parts[1]];
                    if(typeof pl_.onHelpRequest !== 'undefined') {
                        var msg_ = text.substr(parts[0].length + 1 + parts[1].length + 1);
                        parts = msg_.split(" ");
                        if(msg_.length === 0) parts = [];
                        pl_.onHelpRequest(CLIENT, SERVER, user, msg_, parts);
                    }
                    else {
                        CLIENT.say(nick, "Für das Plugin " + parts[1] + " ist keine Hilfe verfügbar.");
                    }
                }
            }
        }
        else {
            for(var p in PLUGINS.plugins) {
                var pl = PLUGINS.plugins[p];
                if(typeof pl.onPrivateMessage !== 'undefined') {
                    pl.onPrivateMessage(CLIENT, SERVER, user, text);
                }
            }
        }
    }
    else {
        LOG.log('[{@cyan}%s{@reset}] %s: %s', to, nick, text);
        var channel = SERVER.getChannel(to);
        if( text.indexOf( CONFIG.get('commandChar') ) === 0 ) {
            var cmdName = text.split(" ")[0].substr(1).toLowerCase();
            var msg = text.substr(cmdName.length+2);
            var params = msg.split(" ");
            if(params.length == 1 && params[0] === "") {
                params = [];
            }
            LOG.debug('[CMD] %s|%s|%s|%s|%s', CONFIG.get('commandChar'), cmdName, params, msg, text);
            for(var _p in PLUGINS.plugins) {
                var _pl = PLUGINS.plugins[_p];
                if(typeof _pl.onCommand !== 'undefined' && !PLUGINS.isDisabled(_p, channel.getName())) {
                    _pl.onCommand(CLIENT, SERVER, channel, CONFIG.get('commandChar'), cmdName, params, user, msg, text);
                }
            }
        }
        else {
            if(UTIL.startsWith(text, CLIENT.nick)) {
                var _text = text.slice(CLIENT.nick.length);
                if(_text[0] == ":") {
                    _text = _text.slice(1);
                }
                if(_text[0] == " ") {
                    _text = _text.slice(1);
                }
                for(var __p in PLUGINS.plugins) {
                    var __pl = PLUGINS.plugins[__p];
                    if(typeof __pl.onResponseMessage !== 'undefined' && !PLUGINS.isDisabled(__p, channel.getName())) {
                        __pl.onResponseMessage(CLIENT, SERVER, channel, user, _text);
                    }
                }
            }
            for(var ___p in PLUGINS.plugins) {
                var ___pl = PLUGINS.plugins[___p];
                if(typeof ___pl.onChannelMessage !== 'undefined' && !PLUGINS.isDisabled(___p, channel.getName())) {
                    ___pl.onChannelMessage(CLIENT, SERVER, channel, user, text);
                }
            }
        }
    }
});

CLIENT.addListener('notice', function(nick, to, text, message) {
    if( nick === null || typeof nick == 'undefined' ) {
        LOG.log('[{@green}%s{@reset}] %s', CONFIG.get('irc:server'), text);
    } else {
        if( to === CONFIG.get('irc:nick') ) {
            LOG.log('[{@red}W{@reset}] %s: %s', nick, text);
        }
        else{
            LOG.log('[{@cyan}%s{@reset}] * %s %s', to, nick, text);
        }
        for(var p in PLUGINS.plugins) {
            var pl = PLUGINS.plugins[p];
            if(typeof pl.onNotice !== 'undefined') {
                pl.onNotice(CLIENT, SERVER, SERVER.getUser(nick), to, text);
            }
        }
    }
});

CLIENT.addListener('ping', function(server) {
    LOG.debug('[{@green}%s{@reset}] - Ping/Pong', server);
    SERVER.lastping = new Date();
    for(var p in PLUGINS.plugins) {
        var pl = PLUGINS.plugins[p];
        if(typeof pl.onPing !== 'undefined') {
            pl.onPing(CLIENT, SERVER);
        }
    }
});

CLIENT.addListener('ctcp', function(from, to, text, type) {
    if(text.substr(0, 6) == "ACTION") {
        for(var p in PLUGINS.plugins) {
            var pl = PLUGINS.plugins[p];
            if(typeof pl.onAction !== 'undefined') {
                pl.onAction(CLIENT, SERVER, from, to, text.substr(7));
            }
        }
    }
    else {
        for(var _p in PLUGINS.plugins) {
            var _pl = PLUGINS.plugins[_p];
            if(typeof _pl.onCTCP !== 'undefined') {
                _pl.onCTCP(CLIENT, SERVER, from, to, text, type);
            }
        }
    }
});

CLIENT.addListener('ctcp-version', function(from, to) {
    CLIENT.ctcp(from, "notice", "VERSION " + CONFIG.get('version'));
});

CLIENT.addListener('nick', function(oldnick, newnick, channels, message) {
    LOG.log('[{@cyan}%s{@reset}] %s heisst nun %s', CONFIG.get('irc:server'), oldnick, newnick);
    var user = SERVER.getUser(oldnick);
    user.setNick(newnick);
    for(var p in PLUGINS.plugins) {
        var pl = PLUGINS.plugins[p];
        if(typeof pl.onNick !== 'undefined') {
            pl.onNick(CLIENT, SERVER, channels, user, oldnick, newnick);
        }
    }
});

CLIENT.addListener('invite', function(channel, from, message) {
    LOG.log('[{@green}%s{@reset}] %s hat dich in %s eingeladen', CONFIG.get('irc:server'), from, channel);
    for(var p in PLUGINS.plugins) {
        var pl = PLUGINS.plugins[p];
        if(typeof pl.onInvite !== 'undefined') {
            pl.onInvite(CLIENT, SERVER, channel, from);
        }
    }
});

CLIENT.addListener('+mode', function(channel, by, mode, argument, message) {
    var _channel = SERVER.getChannel(channel);
    if (typeof argument !== 'undefined') {
        //TODO: pw
        _channel.addUserMode(argument, mode);
        if(_channel.userExistInChannel(argument)) {
            CLIENT.whois(SERVER.getUser(argument).getNick());
        }
        LOG.log('[{@cyan}%s{@reset}] %s setze den Mode: +%s %s', channel, by, mode, argument);
    } else {
        _channel.setMode(mode);
        LOG.log('[{@cyan}%s{@reset}] %s setze den Mode: +%s', channel, by, mode);
    }
    for(var p in PLUGINS.plugins) {
        var pl = PLUGINS.plugins[p];
        if(typeof pl.onMode !== 'undefined' && !PLUGINS.isDisabled(p, _channel.getName())) {
            pl.onMode(CLIENT, SERVER, _channel, by, mode, true, argument);
        }
    }
});
CLIENT.addListener('-mode', function(channel, by, mode, argument, message) {
    var _channel = SERVER.getChannel(channel);
    if (typeof argument !== 'undefined') {
        //TODO: pw
        _channel.remUserMode(argument, mode);
        if(_channel.userExistInChannel(argument)) {
            CLIENT.whois(SERVER.getUser(argument).getNick());
        }
        LOG.log('[{@cyan}%s{@reset}] %s setze den Mode: -%s %s', channel, by, mode, argument);
    } else {
        _channel.setMode(mode);
        LOG.log('[{@cyan}%s{@reset}] %s setze den Mode: -%s', channel, by, mode);
    }
    for(var p in PLUGINS.plugins) {
        var pl = PLUGINS.plugins[p];
        if(typeof pl.onMode !== 'undefined' && !PLUGINS.isDisabled(p, _channel.getName())) {
            pl.onMode(CLIENT, SERVER, _channel, by, mode, false, argument);
        }
    }
});

CLIENT.addListener('whois', function(info) {
    LOG.debug('[whois] >> %s', info.nick);
    for(var i in info.channels) {
        var channame = "#"+info.channels[i].split("#")[1];
        var _channel = SERVER.getChannel(channame);
        var mode = info.channels[i].split("#")[0];
        var user = SERVER.getUser(info.nick);
        user.setUserName(info.user);
        user.setHost(info.host);
        user.setServer(info.server);
        user.setRealname(info.realname);
        var _chans = [];
        for(var j=0; j<info.channels.length; j++) {
            _chans.push("#"+info.channels[j].split("#")[1]);
        }
        user.setInChannels(_chans);
        user.setAccount(info.account);
        if(mode !== "") {
            _channel.addUserMode(info.nick, mode);
        }
        if(info.hasOwnProperty("idle")) {
            user.setIdleTime(info.idle);
        }
    }
});
CLIENT.addListener('raw', function(message) {
    //console.log(message);
});
CLIENT.addListener('channellist_item', function(info) {
    if(info.name[0] !== "#") return;
    var _channel = SERVER.getChannel(info.name), pos = 0, modes;
    _channel.setUserCount(info.users);

    for(; pos<info.topic.length; pos++) {
        if(info.topic[pos] == "]") break;
    }
    _channel.setTopic({
        "nick": null,
        "topic": info.topic.slice(pos+2),
        "time": null
    });

    modes = info.topic.slice(2, pos);
    for(var i=0; i<modes.length; i++) {
        _channel.setMode(modes[i]);
    }
});

CLIENT.addListener('error', function(message) {
    LOG.error('CLIENT ERROR: %s: %s', message.command, message.args.join(' '));
    for(var p in PLUGINS.plugins) {
        var pl = PLUGINS.plugins[p];
        if(typeof pl.onIRCError !== 'undefined') {
            pl.onIRCError(CLIENT, SERVER, message);
        }
    }
});

require('fs').readdir("./plugins", function(err, files) {
    for(var f in files) {
        var name = files[f];
        if(name == "README.md" || name[0] == "_") continue;
        PLUGINS.loadPlugin(name);
    }
});

try {
    process.on('SIGINT', function() {
        QUIT(1);
    });
}
catch(e) {
    LOG.error(e);
}