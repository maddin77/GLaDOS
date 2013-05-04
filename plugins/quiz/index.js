module.exports = {
    questions: require('./questions-de.js'),
    rules: ["Keine Suchmaschinen(Google/Bing/Yahoo/etc.)", "Raten ist erlaubt, solange es nicht in Spam ausartet"],
    active: false,
    wait: false,
    activeQuestion: null,
    userScore: {},
    questionDelay: 5,
    qString: "",
    intervalId: null,
    tippDelay: 30,
    maxTipps: 5,
    channel: null,

    right: function(client, user) {
        if(!this.active) return;
        var nick = user.getNick();
        if( !this.userScore.hasOwnProperty( nick ) ) {
            this.userScore[nick] = 0;
        }
        this.userScore[nick]++;
        this.saveScore();
        client.say(this.channel, "[\u000309\u0002QUIZ\u000f] " + IRC.colors.wrap("yellow", nick) + " hat die richtige Antwort gewusst! Die richtige Antwort war: " + IRC.colors.wrap("yellow", this.activeQuestion.Answer.replace(/\#/g,'')) );
        this.stopTipps();
        this.wait = true;
        var that = this;
        setTimeout(function() {
            that.showQuestion(client);
        }, this.questionDelay*1000);
    },
    showQuestion: function(client) {
        if(!this.active) return;
        this.wait = false;
        var frageNum = Math.round( 1 + ( Math.random() * ( Object.keys(this.questions).length - 1 ) ) );
        this.qString = this.start(frageNum);
        client.say(this.channel, "[\u000309\u0002QUIZ\u000f] " + this.qString);
        this.startTipps(client);
    },
    start: function(frageNum) {
        var questionString = "";

        this.active = true;

        this.questions[ frageNum ].alreadyAsked = true;
        this.questions[ frageNum ].answered = false;

        this.activeQuestion = this.questions[ frageNum ];

        console.log( frageNum );
        console.log( this.questions[ frageNum ] );

        questionString = "[Frage: " + IRC.colors.wrap("light_blue", frageNum) + "]";

        if ( typeof this.questions[ frageNum ].Category !== 'undefined' ) {
            questionString += " [Kategorie: " + IRC.colors.wrap("orange", this.questions[ frageNum ].Category) + "]";
        }
        if ( typeof this.questions[ frageNum ].Level !== 'undefined' ) {
            questionString += " [Level: " + IRC.colors.wrap("orange", this.questions[ frageNum ].Level) + "]";
        }
        questionString += " " + IRC.colors.wrap("light_cyan", this.questions[ frageNum ].Question);

        return questionString;
    },
    startTipps: function(client) {
        if(!this.active) return;
        var tippCount = 0;
        var that = this;

        this.intervalId = setInterval(function() {
            if(this.intervalId == -1) return;
            tippCount++;
            if( tippCount === 1 && typeof that.activeQuestion.Tip !== 'undefined' ) {
                client.say(that.channel, "[\u000309\u0002QUIZ\u000f] [Tip " + IRC.colors.wrap("yellow", tippCount) + "] " + that.activeQuestion.Tip);
            }
            else if( tippCount > that.maxTipps || tippCount > that.activeQuestion.Answer.replace(/\#/g,'').length ) {
                that.stopTipps();
                that.noRightAnswer(client);
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
                        if(j+1 <= tippCount) {
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
                client.say(that.channel, "[\u000309\u0002QUIZ\u000f] [Tip " + IRC.colors.wrap("yellow", tippCount) + "] " + tipp);
            }
        }, this.tippDelay*1000);
    },
    noRightAnswer: function(client) {
        if(!this.ative) return;
        client.say(this.channel, "[\u000309\u0002QUIZ\u000f] Die Zeit ist um. Niemand von euch versagern hat die richtige antwort gewusst!");
        client.say(this.channel, "[\u000309\u0002QUIZ\u000f] Aber um trotzdem noch etwas für eure Allgemeinbildung zu tun; Die richte Antwort war: " + IRC.colors.wrap("yellow", this.activeQuestion.Answer.replace(/\#/g,'')));
        client.say(this.channel, "[\u000309\u0002QUIZ\u000f] Die nächste Frage folgt in " + IRC.colors.wrap("orange", this.questionDelay) + " Sekunden.");
        this.stopTipps();
        this.wait = true;
        var that = this;
        setTimeout(function() {
            that.showQuestion(client);
        }, this.questionDelay*1000);
    },
    stop: function() {
        this.stopTipps();
        this.active = false;
    },
    stopTipps: function() {
        clearInterval(this.intervalId);
        this.intervalId = -1;
    },
    saveScore: function() {
        //ToDo: save score
        for(var nick in this.userScore) {
            var value = this.userScore[nick];
            DATABASE.query("INSERT INTO `quiz` (`nick`,`value`) VALUES (?,?) ON DUPLICATE KEY UPDATE `value` = ?", [nick, value, value], function(err, results) {
                if(err) {
                    console.error(err);
                    QUIT(1);
                }
            });
        }
    },
    checkAnswer: function(message) {
        var answer = this.activeQuestion.Answer;
        message = message.toLowerCase();
        if( message.search( answer.replace(/\#/g,'').toLowerCase() ) !== -1 ) return true;

        var tr = {"ä":"ae", "ü":"ue", "ö":"oe", "ß":"ss" };
        if( message.replace(/[äöüß]/g, function($0) { return tr[$0]; }).search( answer.replace(/\#/g,'').toLowerCase().replace(/[äöüß]/g, function($0) { return tr[$0]; }) ) !== -1 ) return true;

        return false;
    },

    onJoin: function(client, server, channel, user) {
        if(channel.getName() == this.channel && this.active) {
            client.notice(user.getNick(), "Willkommen in " + channel.getName() + ", " + user.getNick() + "! In diesem Channel wird zur Zeit Quiz gespielt. Mehr Informationen erhälst du per '" + CONFIG.get('commandChar') + "quizhelp'.");
        }
    },
    onChannelMessage: function(client, server, channel, user, message) {
        if(channel.getName() == this.channel && this.active && !this.wait) {
            var answer = this.activeQuestion.Answer;
            if( typeof this.activeQuestion.Regexp !== 'undefined' ) {
                var regex = this.activeQuestion.Regexp;
                var re = new RegExp(regex, 'i');
                if( message.toLowerCase().match(re) ) {
                    this.right(client, user);
                }
            }
            else {
                if( this.checkAnswer(message) ) {
                    this.right(client, user);
                }
            }
        }
    },
    onCommand: function(client, server, channel, commandChar, name, params, user, text, message) {
        if(name == "quiz") {
            if(!user.hasPermissions()) return client.notice(user.getNick(), "Du hast nicht die nötigen rechte dazu.");
            if(params.length === 0) return client.notice(user.getNick(), commandChar + name + " <START/STOP/NEXT>");
            if(params[0].toLowerCase() == "start") {
                if(this.active) return client.notice(user.getNick(), "Das Quiz läuft bereits.");
                if(this.channel !== null && channel.getName() != this.channel) return client.notice(user.getNick(), "Das Quiz läuft bereits in einem anderen Channel.");
                client.say(channel.getName(), "[\u000309\u0002QUIZ\u000f] " + IRC.colors.wrap("yellow", user.getNick()) + " hat das Quiz gestartet!");
                client.say(channel.getName(), "[\u000309\u0002QUIZ\u000f] Meine Datenbank umfasst " + IRC.colors.wrap("orange", Object.keys(this.questions).length) + " Fragen.");
                client.say(channel.getName(), "[\u000309\u0002QUIZ\u000f] Die erste Frage folgt in " + IRC.colors.wrap("orange", this.questionDelay) + " Sekunden.");
                this.active = true;
                this.stopTipps();
                this.wait = true;
                this.channel = channel.getName();
                var that = this;
                setTimeout(function() {
                    that.showQuestion(client, channel);
                }, this.questionDelay*1000);
            }
            else if(params[0].toLowerCase() == "stop") {
                if(!this.active || this.channel === null) return client.notice(user.getNick(), "Zur Zeit läuft kein Quiz.");
                if(channel.getName() != this.channel) return client.notice(user.getNick(), "In diesem Channel läuft kein Quiz.");
                this.active = false;
                this.stop();
                this.channel = null;
                client.say(channel.getName(), "[\u000309\u0002QUIZ\u000f] " + IRC.colors.wrap("yellow", user.getNick()) + " hat das Quiz gestoppt!");
            }
            else if(params[0].toLowerCase() == "next") {
                if(!this.active || this.channel === null) return client.notice(user.getNick(), "Zur Zeit läuft kein Quiz.");
                if(channel.getName() != this.channel) return client.notice(user.getNick(), "In diesem Channel läuft kein Quiz.");
                client.say(this.channel, "[\u000309\u0002QUIZ\u000f] Diese Frage wird übersprungen.");
                this.stopTipps();
                this.wait = true;
                var _that = this;
                setTimeout(function() {
                    _that.showQuestion(client);
                }, this.questionDelay*1000);
            }
            return true;
        }
        else if(name == "frage") {
            if(!this.active || this.channel === null) return client.notice(user.getNick(), "Zur Zeit läuft kein Quiz.");
            if(channel.getName() != this.channel) return client.notice(user.getNick(), "In diesem Channel läuft kein Quiz.");
            if(this.wait) return client.notice(user.getNick(), "Es wurde noch keine neue Frage gestellt. Bitte gedulde dich einen Augenblick.");
            client.notice(user.getNick(), "Die aktuelle frage ist: " + this.qString);
            return true;
        }
        else if(name == "quizhelp") {
            if(!this.active || this.channel === null) return client.notice(user.getNick(), "Zur Zeit läuft kein Quiz.");
            if(channel.getName() != this.channel) return client.notice(user.getNick(), "In diesem Channel läuft kein Quiz.");
            client.notice(user.getNick(), "In diesem Channel wird Quiz gespielt. Es gelten folgende Regeln:");
            for(var i=0; i<this.rules.length; i++) {
                client.notice(user.getNick(), "    $" + (i+1) + " - " + this.rules[i]);
            }
            client.notice(user.getNick(), "Wenn du nicht bis zur nächsten Frage warten möchtest, kannst du '" + CONFIG.get('commandChar') + "frage' nutzen um die aktuelle Frage zu erhalten.");
            client.notice(user.getNick(), "Mit '" + CONFIG.get('commandChar') + "quizscore' erhälst du deine aktuelle Punktzahl.");
            client.notice(user.getNick(), "Viel Spaß beim Quizzen! :)");
            return true;
        }
        else if(name == "quizscore") {
            var _nick = user.getNick();
            if( !this.userScore.hasOwnProperty( _nick ) ) {
                this.userScore[_nick] = 0;
            }
            client.notice(user.getNick(), "Du hast " + this.userScore[_nick] + " Fragen richtig beantwortet.");
            var score = [];
            for(var nick in this.userScore) {
                var value = this.userScore[nick];
                score.push({
                    "nick": nick,
                    "value": value
                });
            }
            score.sort(function(a,b) {
                if(a.value > b.value) return -1;
                if(a.value == b.value) return 0;
                if(a.value < b.value) return 1;
            });
            score = score.slice(0,5);
            var max = [];
            for(var j = 0; j < score.length; j++) {
                max.push(score[j].nick + " ("+score[j].value+")");
            }
            client.notice(user.getNick(), "Toplist: " + max.join(", "));
            return true;
        }
    },
    onLoad: function() {
        DATABASE.query("CREATE TABLE IF NOT EXISTS `quiz` (`nick` varchar(255) NOT NULL DEFAULT '',`value` int(11) DEFAULT NULL,PRIMARY KEY (`nick`)) ENGINE=InnoDB DEFAULT CHARSET=utf8;");
        var that = this;
        DATABASE.query("SELECT * FROM `quiz`", function(err, results) {
            if(err) {
                console.error(err);
                QUIT(1);
            }
            else {
                for(var i=0; i<results.length; i++) {
                    that.userScore[ results[i].nick ] = results[i].value;
                }
                console.log(that.userScore);
            }
        });
    },
    onUnload: function() {}
};