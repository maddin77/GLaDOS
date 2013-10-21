var QuizPlugin = function() {
    this.questions = require('./questions-de.js');
    this.rules = ["No excessive flooding and scripting", "It's a privilege, not a right to quiz."];
    this.active =  false;
    this.wait =  false;
    this.activeQuestion =  null;
    this.questionDelay =  5;
    this.qString =  "";
    this.intervalId =  null;
    this.tippDelay =  30;
    this.tippCount =  0;
    this.maxTipps =  5;
    this.frageNum =  -1;
    this.postTops =  0;
    this.channel = '#quiz';
    this.revolte = {
        needed: -1,
        has: []
    };
};
QuizPlugin.prototype.getScore = function(nick, callback) {
    this.redis.hget("quiz", nick, function (err, obj) {
        callback(parseInt(obj || 0, 10));
    });
};
QuizPlugin.prototype.addScore = function(nick, callback) {
    var that = this;
    this.getScore(nick, function(score) {
        that.redis.hset("quiz", nick, score+1);
        if(typeof(callback) == typeof(Function)) {
            callback(score+1);
        }
    });
};
QuizPlugin.prototype.getTopList = function(callback) {
    this.redis.hgetall("quiz", function (err, obj) {
        var _scores = obj || {};
        var scores = [];
        Object.keys(_scores).forEach(function(nick) {
            var score = _scores[nick];
            scores.push({
                "nick": nick,
                "score": score
            });
        });
        scores.sort(function(a,b) {
            return b.score - a.score;
        });
        var max = [];
        scores.forEach(function(val) {
            max.push(val.nick + " ("+val.score+")");
        });
        callback(max.join(", "));
    });
};
QuizPlugin.prototype.right = function(user, channel) {
    if(!this.active) return;
    var nick = user.getNick();
    this.addScore(nick);
    this.questions[ this.frageNum ].alreadyAsked = true;
    this.questions[ this.frageNum ].answered = true;
    channel.say("[\u0002QUIZ\u000f] " + nick + " hat die richtige Antwort gewusst! Die richtige Antwort war: " + this.activeQuestion.Answer.replace(/\#/g,'') );
    this.stopTipps();
    this.wait = true;
    this.postTopList(channel);
    var that = this;
    setTimeout(function() {
        that.showQuestion(channel);
    }, this.questionDelay*1000);
};
QuizPlugin.prototype.showQuestion = function(channel) {
    if(!this.active) return;
    this.tippCount = 0;
    this.wait = false;
    var frageNum = Math.round( 1 + ( Math.random() * ( Object.keys(this.questions).length - 1 ) ) );
    while(this.questions[ frageNum ].answered === false) {
        frageNum = Math.round( 1 + ( Math.random() * ( Object.keys(this.questions).length - 1 ) ) );
    }
    this.qString = this.start(frageNum);
    channel.say("[\u0002QUIZ\u000f] " + this.qString);
    this.startTipps(channel);
    this.revolte.needed = -1;
    this.revolte.has = [];
};
QuizPlugin.prototype.showNextQuestion = function(channel, frageNum) {
    if(!this.active) return;
    this.tippCount = 0;
    this.wait = false;
    this.qString = this.start(frageNum);
    channel.say("[\u0002QUIZ\u000f] " + this.qString);
    this.startTipps(channel);
    this.revolte.needed = -1;
    this.revolte.has = [];
};
QuizPlugin.prototype.start = function(frageNum) {
    this.frageNum = frageNum;
    var questionString = "";

    this.active = true;

    //this.questions[ frageNum ].alreadyAsked = true;
    //this.questions[ frageNum ].answered = false;

    this.activeQuestion = this.questions[ frageNum ];

    //console.log( frageNum );
    //console.log( this.questions[ frageNum ] );

    questionString = "[Frage: " + frageNum + "]";

    if ( typeof this.questions[ frageNum ].Category !== 'undefined' ) {
        questionString += " [Kategorie: " + this.questions[ frageNum ].Category + "]";
    }
    if ( typeof this.questions[ frageNum ].Level !== 'undefined' ) {
        questionString += " [Level: " + this.questions[ frageNum ].Level + "]";
    }
    questionString += " " + this.questions[ frageNum ].Question;

    return questionString;
};
QuizPlugin.prototype.startTipps = function(channel) {
    if(!this.active) return;
    var that = this;

    this.intervalId = setInterval(function() {
        if(that.intervalId == -1) return;
        that.tippCount++;
        if( that.tippCount === 1 && typeof that.activeQuestion.Tip !== 'undefined' ) {
            channel.say("[\u0002QUIZ\u000f] [Tip " + that.tippCount + "] " + that.activeQuestion.Tip);
        }
        else if( that.tippCount > that.maxTipps || that.tippCount > that.activeQuestion.Answer.replace(/\#/g,'').length ) {
            that.stopTipps();
            that.noRightAnswer(channel);
        }
        else {
            var tipp = "";
            var string = that.activeQuestion.Answer.replace(/\#/g,'');
            var splitEvery = that.maxTipps;
            var match =  '.{1,' + splitEvery + '}';
            var re = new RegExp(match, 'g');
            var parts = string.match(re);
            for(var p=0; p<parts.length; p++) {
                var part = parts[p];
                for(var j=0; j<part.length; j++) {
                    if(j+1 <= that.tippCount) {
                        tipp += part.charAt(j);
                    }
                    else {
                        if( part.charAt(j) == " " ) {
                            tipp += ' ';
                        } else {
                            tipp += '_';
                        }
                    }
                    tipp += ' ';
                }
            }
            channel.say("[\u0002QUIZ\u000f] [Tip " + that.tippCount + "] " + tipp);
        }
    }, this.tippDelay*1000);
};
QuizPlugin.prototype.noRightAnswer = function(channel) {
    if(!this.active) return;
    channel.say("[\u0002QUIZ\u000f] Die Zeit ist um. Niemand hat die richtige antwort gewusst!");
    channel.say("[\u0002QUIZ\u000f] Aber um trotzdem noch etwas für eure Allgemeinbildung zu tun; Die richte Antwort war: " + this.activeQuestion.Answer.replace(/\#/g,''));
    channel.say("[\u0002QUIZ\u000f] Die nächste Frage folgt in " + this.questionDelay + " Sekunden.");
    this.stopTipps();
    this.questions[ this.frageNum ].alreadyAsked = true;
    this.wait = true;
    this.postTopList(channel);
    var that = this;
    setTimeout(function() {
        that.showQuestion(channel);
    }, this.questionDelay*1000);
};
QuizPlugin.prototype.postTopList = function(channel) {
    this.postTops++;
    if(this.postTops >= 5) {
        this.postTops = 0;
        this.getTopList(function(list) {
            channel.say("[\u0002QUIZ\u000f] Toplist: " + list);
        });
    }
};
QuizPlugin.prototype.stop = function() {
    this.stopTipps();
    this.active = false;
};
QuizPlugin.prototype.stopTipps = function() {
    clearInterval(this.intervalId);
    this.intervalId = -1;
};
QuizPlugin.prototype.checkAnswer = function(message) {
    var answer = this.activeQuestion.Answer;
    message = message.toLowerCase();
    if( message.search( answer.replace(/\#/g,'').toLowerCase() ) !== -1 ) return true;

    var tr = {"ä":"ae", "ü":"ue", "ö":"oe", "ß":"ss" };
    if( message.replace(/[äöüß]/g, function($0) { return tr[$0]; }).search( answer.replace(/\#/g,'').toLowerCase().replace(/[äöüß]/g, function($0) { return tr[$0]; }) ) !== -1 ) return true;

    return false;
};
QuizPlugin.prototype.onJoin = function(server, channel, user) {
    if(channel.getName() == this.channel && this.active) {
        user.notice("Willkommen in " + channel.getName() + ", " + user.getNick() + "! In diesem Channel wird zur Zeit Quiz gespielt. Mehr Informationen erhälst du per \"!quizhelp\".");
    }
};
QuizPlugin.prototype.onChannelMessage = function(server, channel, user, text) {
    if(channel.getName() == this.channel && this.active && !this.wait) {
        var answer = this.activeQuestion.Answer;
        if( typeof this.activeQuestion.Regexp !== 'undefined' ) {
            var regex = this.activeQuestion.Regexp;
            var re = new RegExp(regex, 'i');
            if( text.toLowerCase().match(re) ) {
                this.right(user, channel);
            }
        }
        else {
            if( this.checkAnswer(text) ) {
                this.right(user, channel);
            }
        }
    }
};
QuizPlugin.prototype.onCommand = function(server, channel, cmdName, params, user, msg, text) {
    if(cmdName == "quiz") {
        if(!user.hasPermissions()) return user.notice("Du hast nicht die nötigen rechte dazu.");
        if(this.channel != channel.getName()) return user.notice("Du musst im Channel '" + this.channel + "' sein.");
        if(params.length === 0) return user.notice("!quiz <START/STOP/NEXT>");
        if(params[0].toLowerCase() == "start") {
            if(this.active) return user.notice("Das Quiz läuft bereits.");
            if(this.channel !== null && channel.getName() != this.channel) return user.notice("Das Quiz läuft bereits in einem anderen Channel.");
            channel.say("[\u0002QUIZ\u000f] " + user.getNick() + " hat das Quiz gestartet!");
            channel.say("[\u0002QUIZ\u000f] Meine Datenbank umfasst " + Object.keys(this.questions).length + " Fragen.");
            channel.say("[\u0002QUIZ\u000f] Die erste Frage folgt in " + this.questionDelay + " Sekunden.");
            this.active = true;
            this.stopTipps();
            this.wait = true;
            var that = this;
            setTimeout(function() {
                that.showQuestion(channel);
            }, this.questionDelay*1000);
        }
        else if(params[0].toLowerCase() == "stop") {
            if(!user.hasPermissions()) return user.notice("Du hast nicht die nötigen rechte dazu.");
            if(this.channel != channel.getName()) return user.notice("Du musst im Channel '" + this.channel + "' sein.");
            if(!this.active) return user.notice("Zur Zeit läuft kein Quiz.");
            if(channel.getName() != this.channel) return user.notice("In diesem Channel läuft kein Quiz.");
            this.active = false;
            this.stop();
            channel.say("[\u0002QUIZ\u000f] " + user.getNick() + " hat das Quiz gestoppt!");
        }
        else if(params[0].toLowerCase() == "next") {
            if(!user.hasPermissions()) return user.notice("Du hast nicht die nötigen rechte dazu.");
            if(this.channel != channel.getName()) return user.notice("Du musst im Channel '" + this.channel + "' sein.");
            if(!this.active) return user.notice("Zur Zeit läuft kein Quiz.");
            if(channel.getName() != this.channel) return user.notice("In diesem Channel läuft kein Quiz.");
            channel.say("[\u0002QUIZ\u000f] Diese Frage wird übersprungen.");
            if(params.length == 1) {
                this.stopTipps();
                this.wait = true;
                var _that = this;
                setTimeout(function() {
                    _that.showQuestion(channel);
                }, this.questionDelay*1000);
            }
            else if(params.length > 1) {
                var id = parseInt(params[1], 10);
                this.stopTipps();
                this.wait = true;
                var __that = this;
                setTimeout(function() {
                    __that.showNextQuestion(channel,id);
                }, this.questionDelay*1000);
            }
        }
        return true;
    }
    else if(cmdName == "frage") {
        if(this.channel != channel.getName()) return user.notice("Du musst im Channel '" + this.channel + "' sein.");
        if(!this.active || this.channel === null) return user.notice("Zur Zeit läuft kein Quiz.");
        if(this.wait) return user.notice("Es wurde noch keine neue Frage gestellt. Bitte gedulde dich einen Augenblick.");
        user.notice("Die aktuelle frage ist: " + this.qString);
        return true;
    }
    else if(cmdName == "quizhelp") {
        if(this.channel != channel.getName()) return user.notice("Du musst im Channel '" + this.channel + "' sein.");
        if(!this.active) return user.notice("Zur Zeit läuft kein Quiz.");
        user.notice("In diesem Channel wird Quiz gespielt. Es gelten folgende Regeln:");
        for(var i=0; i<this.rules.length; i++) {
            user.notice("    $" + (i+1) + " - " + this.rules[i]);
        }
        user.notice("Wenn du nicht bis zur nächsten Frage warten möchtest, kannst du '!frage' nutzen um die aktuelle Frage zu erhalten.");
        user.notice("Mit '!quizscore' erhälst du deine aktuelle Punktzahl.");
        user.notice("Viel Spaß beim Quizzen! :)");
        return true;
    }
    else if(cmdName == "quizscore") {
        if(this.channel != channel.getName()) return user.notice("Du musst im Channel '" + this.channel + "' sein.");
        var _nick = user.getNick();
        this.getScore(_nick, function(score) {
            user.notice("Du hast " + score + " Fragen richtig beantwortet.");
        });
        this.getTopList(function(toplist) {
            user.notice("Toplist: " + toplist);
        });
        return true;
    }
    else if(cmdName == "revolte") {
        if(this.channel != channel.getName()) return user.notice("Du musst im Channel '" + this.channel + "' sein.");
        if(!this.active) return user.notice("Zur Zeit läuft kein Quiz.");
        if(this.tippCount < 1) return user.notice("Ich reagiere nicht auf Revolten wenn nicht mindestens ein Tipp gegeben wurde.");
        if(this.revolte.needed == -1) {
            this.revolte.needed = Math.round((channel.getUserCount()-1)/3*2);
        }
        if(this.revolte.has.indexOf(user.getNick()) == -1) {
            this.revolte.has.push(user.getNick());
            if(this.revolte.has.length == this.revolte.needed) {
                channel.say("[\u0002QUIZ\u000f] Diese Frage wird übersprungen.");
                this.stopTipps();
                this.wait = true;
                var ___that = this;
                setTimeout(function() {
                    ___that.showQuestion(channel);
                }, this.questionDelay*1000);
            }
            else {
                channel.say("[\u0002QUIZ\u000f] " + user.getNick() + " und " + (this.revolte.has.length-1) + " andere mögen diese Frage nicht. Ihr braucht min. " + this.revolte.needed + " Stimmen.");
            }
        }
    }
};
QuizPlugin.prototype.onLoad = function() {
    for(var i=0; i<this.questions.length; i++) {
        this.questions[ i ].alreadyAsked = false;
        this.questions[ i ].answered = false;
    }
};
QuizPlugin.prototype.onHelp = function(server, user, text) {
    user.say("Quiz n shit.");
    user.say("Commands: !math <expression>, !calculate <expression>, !calc <expression>, !c <expression>");
};
module.exports = new QuizPlugin();