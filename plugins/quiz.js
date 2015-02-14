/*global GLaDOS */
'use strict';
var quizdata = require(__dirname + '/../data/quizdata.json');
var __ = require('underscore')._;
var moment = require('moment');
moment.lang('precise-en', {
    relativeTime : {
        future : "in %s",
        past : "%s ago",
        s : "%d seconds", //see https://github.com/timrwood/moment/pull/232#issuecomment-4699806
        m : "a minute",
        mm : "%d minutes",
        h : "an hour",
        hh : "%d hours",
        d : "a day",
        dd : "%d days",
        M : "a month",
        MM : "%d months",
        y : "a year",
        yy : "%d years"
    }
});
moment.lang('precise-en');

var Quiz = function () {
    this.rules = [
        'No excessive flooding and scripting',
        'It\'s a privilege, not a right to quiz.'
    ];
    this.running = false;
    this.halted = false;
    this.questioncounter = 1;
    this.question = {};
    this.lang = '';
    this.channel = null;
    this.questiontime = null;

    this.waitDelay = 5 * 1000;
    this.waitTimer = null;

    this.hintDelay = 30 * 1000;
    this.hintTimer = null;
    this.hintcount = 0;
    this.MAX_HINTS = 5;

    this.haltDelay = 5 * 60 * 1000;
    this.haltTimer = null;
};
Quiz.prototype.getQuestionTime = function () {
    return this.questiontime;
};
Quiz.prototype.getQuestion = function () {
    return this.question;
};
Quiz.prototype.getCounter = function () {
    return this.questioncounter;
};
Quiz.prototype.isRunning = function () {
    return this.running;
};
Quiz.prototype.isHalted = function () {
    return this.halted;
};
Quiz.prototype.isQuizOp = function (nick, cb) {
    GLaDOS.brain.smembers('quizop', function (err, member) {
        GLaDOS.logger.debug('[quiz] smembers:quizop %j', member, member);
        cb(member.indexOf(nick) > -1);
    });
};
Quiz.prototype.opNick = function (nick, cb) {
    this.isQuizOp(nick, function (isop) {
        if (isop) {
            GLaDOS.brain.srem('quizop', nick);
        } else {
            GLaDOS.brain.sadd('quizop', nick);
        }
        cb(!isop);
    });
};
Quiz.prototype.getScore = function (nick, cb) {
    GLaDOS.brain.hget('quizscore', nick, function (err, obj) {
        cb(parseInt(obj || 0, 10));
    });
};
Quiz.prototype.addScore = function (nick, score, cb) {
    this.getScore(nick, function (oldscore) {
        GLaDOS.brain.hset('quizscore', nick, oldscore + score);
        if (cb) {
            cb(oldscore + score);
        }
    });
};
Quiz.prototype.setScore = function (nick, score) {
    GLaDOS.brain.hset('quizscore', nick, score);
};
Quiz.prototype.getToplist = function (cb) {
    GLaDOS.brain.hgetall('quizscore', function (err, obj) {
        var _scores = obj || {},
            scores = [];
        Object.keys(_scores).forEach(function (nick) {
            var score = _scores[nick];
            scores.push({
                "nick": nick,
                "score": score
            });
        });
        scores.sort(function (a, b) {
            return b.score - a.score;
        });
        return cb(scores);
    });
};
Quiz.prototype.getRank = function (nick, cb) {
    this.getToplist(function (scores) {
        var i;
        for (i = 0; i < scores.length; i += 1) {
            if (scores[i].nick === nick) {
                return cb(i + 1);
            }
        }
        return cb(scores.length + 1);
    });
};
Quiz.prototype.start = function (lang, channel) {
    this.lang = lang;
    this.channel = channel;
    this.running = true;
    this.halted = false;
    this.questioncounter = 0;
};
Quiz.prototype.getNewQuestion = function (cb) {
    this.question = __.sample(quizdata[this.lang].entries);
    while (this.question.solved === true) {
        this.question = __.sample(quizdata[this.lang].entries);
    }
    this.question.solved = false;
    this.questiontime = moment();
    this.questioncounter += 1;
    this.hintcount = 0;
    cb(this.question, this.questioncounter, this.getQuestionString());
};
Quiz.prototype.getTotalQuestionCount = function () {
    return quizdata[this.lang].questions;
};
Quiz.prototype.getQuizdataCreationDate = function () {
    return moment(quizdata[this.lang].created).format("dddd, MMMM Do YYYY, HH:mm:ss");
};
Quiz.prototype.getQuestionString = function () {
    var str = '';
    if (this.question.hasOwnProperty('category')) {
        str = '(' + this.question.category + ') ';
    }
    str += this.question.question;
    return str;
};
Quiz.prototype.stop = function () {
    this.lang = '';
    this.channel = null;
    this.running = false;
    this.questioncounter = 0;
    if (this.waitTimer) {
        clearTimeout(this.waitTimer);
    }
    if (this.hintTimer) {
        clearTimeout(this.hintTimer);
    }
    if (this.haltTimer) {
        clearTimeout(this.haltTimer);
    }
};
Quiz.prototype.unhalt = function () {
    this.halted = false;
    this.resetHaltTimer();
    this.startHints();
};
Quiz.prototype.halt = function () {
    this.halted = true;
    if (this.waitTimer) {
        clearTimeout(this.waitTimer);
    }
    if (this.hintTimer) {
        clearTimeout(this.hintTimer);
    }
    if (this.haltTimer) {
        clearTimeout(this.haltTimer);
    }
};
Quiz.prototype.isRight = function (text) {
    text = text.toLowerCase();
    if (this.question.solved || !this.question) {
        return false;
    }
    if (this.question.hasOwnProperty('regexp')) {
        if (text.match(new RegExp(this.question.regexp, 'i'))) {
            GLaDOS.logger.debug('[QUIZ] regexp: %s', this.question.regexp);
            return true;
        }
    } else {
        var answer = this.question.answer.replace(/\#/g, '').toLowerCase(),
            tr = {
                "ä": "ae",
                "ü": "ue",
                "ö": "oe",
                "ß": "ss"
            };
        if (text.search(answer) !== -1) {
            GLaDOS.logger.debug('[QUIZ] search: %s', answer);
            return true;
        }
        text = text.replace(/[äöüß]/g, function ($0) {
            return tr[$0];
        });
        answer = answer.replace(/[äöüß]/g, function ($0) {
            return tr[$0];
        });

        if (text.search(answer) !== -1) {
            GLaDOS.logger.debug('[QUIZ] replace: %s', answer);
            return true;
        }
    }
    return false;
};
Quiz.prototype.startHints = function () {
    if (this.hintTimer) {
        clearTimeout(this.hintTimer);
    }
    var self = this;
    this.hintTimer = setTimeout(function () {
        self.getHint();
    }, this.hintDelay);
};
Quiz.prototype.getAnswer = function () {
    return this.question.answer.replace(/\#/g, '');
};
Quiz.prototype.getHint = function () {
    var self = this,
        time,
        hint,
        parts,
        part,
        p,
        j;
    self.hintcount += 1;
    GLaDOS.logger.debug('[quiz] getHint -> %s | %s', self.hintcount, self.MAX_HINTS);
    if (self.hintcount > self.MAX_HINTS) { //MAX_HINTS
        self.question.solved = true;
        time = moment.duration(self.getQuestionTime().diff(moment()), 'milliseconds').humanize();
        self.channel.say(GLaDOS.clrs('[{B}QUIZ{R}] Automatically solved after ' + time + '.'));
        self.channel.say(GLaDOS.clrs('[{B}QUIZ{R}] The answer is: {B}' + self.getAnswer()));
        self.delayNewQuestion();
    } else {
        hint = "";
        parts = self.question.answer.replace(/\#/g, '').match(new RegExp('.{1,' + self.MAX_HINTS + '}', 'g'));
        for (p = 0; p < parts.length; p += 1) {
            part = parts[p];
            for (j = 0; j < part.length; j += 1) {
                if (j + 1 <= self.hintcount) {
                    hint += part.charAt(j);
                } else {
                    if (part.charAt(j) === " ") {
                        hint += ' ';
                    } else {
                        hint += '_';
                    }
                }
                hint += ' ';
            }
        }
        self.channel.say(GLaDOS.clrs('[{B}QUIZ{R}] Hint: {B}' + hint));
        self.hintTimer = setTimeout(function () {
            self.getHint();
        }, self.hintDelay);
    }
};
Quiz.prototype.delayNewQuestion = function () {
    if (this.hintTimer) {
        clearTimeout(this.hintTimer);
    }
    var self = this;
    self.waitTimer = setTimeout(function () {
        self.getNewQuestion(function (question, counter, questionString) {
            GLaDOS.logger.debug('[QUIZ] %j', question, question);
            self.channel.say(GLaDOS.clrs('[{B}QUIZ{R}] The question no. {B}' + counter + '{R} is:'));
            self.channel.say(GLaDOS.clrs('[{B}QUIZ{R}] ' + questionString));
            self.startHints();
        });
    }, self.waitDelay);
};
Quiz.prototype.resetHaltTimer = function () {
    if (this.haltTimer) {
        clearTimeout(this.haltTimer);
    }
    var self = this;
    this.haltTimer = setTimeout(function () {
        self.halt();
        self.channel.say(GLaDOS.clrs('[{B}QUIZ{R}] Quiz halted. Say "!ask" for new questions.'));
    }, this.haltDelay);
};


GLaDOS.register({
    'name': 'quiz',
    'description': 'Play quiz in #quiz',
    'commands': [
        '!quizop [nick]',
        '!stopquiz',
        '!startquiz',
        '!haltquiz',
        '!quiznext',
        '!ask',
        '!rank',
        '!setscore'
    ]
}, function (ircEvent, command) {
    var quiz = new Quiz();
    command('quizop', function (channel, user, name, text, params) {
        if (!user.hasPermissions()) {
            return user.notice('you don\'t have the permissions to use this command.');
        }
        var nick = params.length < 1 ? user.getNick() : params[0];
        quiz.opNick(nick, function (isop) {
            if (isop) {
                channel.say(user.getNick() + ': ' + nick + ' is now quizop.');
                GLaDOS.sendRaw(' MODE #quiz +h ' + nick);
            } else {
                channel.say(user.getNick() + ': ' + nick + ' is no longer quizop.');
                GLaDOS.sendRaw(' MODE #quiz -h ' + nick);
            }
        });
    });
    command('setscore', function (channel, user, name, text, params) {
        if (!user.hasPermissions()) {
            return user.notice('you don\'t have the permissions to use this command.');
        }
        if (params.length < 1) {
            return user.notice('!setscore [nick] <score>');
        }
        var nick, score;
        if (params.length === 1) {
            nick = user.getNick();
            score = parseInt(params[0], 10);
            if (isNaN(score)) {
                return user.notice('score was NaN.');
            }
        } else if (params.length === 2) {
            nick = params[0];
            score = parseInt(params[1], 10);
            if (isNaN(score)) {
                return user.notice('score was NaN.');
            }
        }
        quiz.setScore(nick, score);
        user.notice(GLaDOS.clrs(nick + 'now has <{B}' + score + '{R}> points.'));
    });
    command('startquiz', function (channel, user, name, text, params) {
        quiz.isQuizOp(user.getNick(), function (isop) {
            if (!isop) {
                return user.notice('you don\'t have the permissions to use this command.');
            }
            if (channel.getName() !== '#quiz') {
                return user.notice('This only works in #quiz.');
            }
            if (quiz.isRunning()) {
                return user.notice('The quiz is already running.');
            }
            if (params.length === 0) {
                return user.notice('!startquiz <lang>');
            }
            var lang = params[0];
            if (!quizdata.hasOwnProperty(lang)) {
                return user.notice('I don\'t have any questions in this language.');
            }
            quiz.start(lang, channel);
            channel.say(GLaDOS.clrs('[{B}QUIZ{R}] {U}' + user.getNick() + '{R} started the quiz: {B}' + quiz.getTotalQuestionCount() + '{R} questions in database "' + lang + '" (' + quiz.getQuizdataCreationDate() + ').'));
            quiz.delayNewQuestion();
            quiz.resetHaltTimer();
        });
    });
    command('stopquiz', function (channel, user, name, text, params) {
        quiz.isQuizOp(user.getNick(), function (isop) {
            if (!isop) {
                return user.notice('you don\'t have the permissions to use this command.');
            }
            if (channel.getName() !== '#quiz') {
                return user.notice('This only works in #quiz.');
            }
            if (!quiz.isRunning()) {
                return user.notice('The quiz is not running.');
            }
            quiz.stop();
            channel.say(GLaDOS.clrs('[{B}QUIZ{R}] Quiz stopped.'));
        });
    });
    command('haltquiz', function (channel, user, name, text, params) {
        quiz.isQuizOp(user.getNick(), function (isop) {
            if (!isop) {
                return user.notice('you don\'t have the permissions to use this command.');
            }
            if (channel.getName() !== '#quiz') {
                return user.notice('This only works in #quiz.');
            }
            if (!quiz.isRunning()) {
                return user.notice('The quiz is not running.');
            }
            quiz.halt();
            channel.say(GLaDOS.clrs('[{B}QUIZ{R}] Quiz halted. Say "!ask" for new questions.'));
        });
    });
    command('quiznext', function (channel, user, name, text, params) {
        quiz.isQuizOp(user.getNick(), function (isop) {
            if (!isop) {
                return user.notice('you don\'t have the permissions to use this command.');
            }
            if (channel.getName() !== '#quiz') {
                return user.notice('This only works in #quiz.');
            }
            if (!quiz.isRunning()) {
                return user.notice('The quiz is not running.');
            }
            var time = moment.duration(quiz.getQuestionTime().diff(moment()), 'milliseconds').humanize();
            channel.say(GLaDOS.clrs('[{B}QUIZ{R}] Manually solved after ' + time + ' by ' + user.getNick() + '.'));
            channel.say(GLaDOS.clrs('[{B}QUIZ{R}] The answer is: {B}' + quiz.getAnswer()));
            quiz.delayNewQuestion();
        });
    });
    command('ask', function (channel, user, name, text, params) {
        if (channel.getName() !== '#quiz') {
            return user.notice('This only works in #quiz.');
        }
        if (quiz.isRunning() && !quiz.isHalted()) {
            user.notice(GLaDOS.clrs('[{B}QUIZ{R}] The question no. {B}' + quiz.getCounter() + '{R} is:'));
            user.notice(GLaDOS.clrs('[{B}QUIZ{R}] ' + quiz.getQuestionString()));
        } else if (quiz.isRunning() && quiz.isHalted()) {
            quiz.unhalt();
            channel.say(GLaDOS.clrs('[{B}QUIZ{R}] Quiz continued. The question no. {B}' + quiz.getCounter() + '{R} is:'));
            channel.say(GLaDOS.clrs('[{B}QUIZ{R}] ' + quiz.getQuestionString()));
        } else {
            user.notice('The quiz is not running.');
        }
    });
    command('rules', function (channel, user, name, text, params) {
        if (channel.getName() !== '#quiz') {
            return user.notice('This only works in #quiz.');
        }
        quiz.rules.forEach(function (rule) {
            user.notice(rule);
        });
    });
    command('rank', function (channel, user, name, text, params) {
        if (channel.getName() !== '#quiz') {
            return user.notice('This only works in #quiz.');
        }
        quiz.getToplist(function (scores) {
            var userscore = {
                'nick': user.getNick(),
                'score': -1,
                'index:': -1
            }, index;
            for (index = 0; index < scores.length; index += 1) {
                if (index < 5) {
                    if (scores[index].nick === user.getNick()) {
                        userscore.score = 0;
                        user.notice(GLaDOS.clrs('[' + (index + 1) + '] {B}' + scores[index].nick + '{R} - ' + scores[index].score + 'pt'));
                    } else {
                        user.notice('[' + (index + 1) + '] ' + scores[index].nick + ' - ' + scores[index].score + 'pt');
                    }
                } else {
                    if (scores[index].nick === user.getNick()) {
                        userscore.score = scores[index].score;
                        userscore.index = index + 1;
                    }
                }
            }
            if (userscore.score !== 0) {
                if (scores.length > 5 && userscore.index !== 6) {
                    user.notice('...');
                }
                if (userscore.score === -1) {
                    user.notice(GLaDOS.clrs('[' + (scores.length + 1) + '] {B}' + userscore.nick + '{R} - 0pt'));
                } else {
                    user.notice(GLaDOS.clrs('[' + userscore.index + '] {B}' + userscore.nick + '{R} - ' + userscore.score + 'pt'));
                }
            }
        });
    });
    ircEvent('message', function (channel, user, text) {
        if (channel.getName() === '#quiz' && quiz.isRunning() && !quiz.isHalted()) {
            if (quiz.isRight(text)) {
                var question = quiz.getQuestion(),
                    nick = user.getNick(),
                    time = moment.duration(quiz.getQuestionTime().diff(moment()), 'milliseconds').humanize(),
                    points = question.score || 1;
                question.solved = true;
                quiz.addScore(nick, points, function (score) {
                    quiz.getRank(nick, function (rank) {
                        channel.say(GLaDOS.clrs('[{B}QUIZ{R}] {B}' + nick + '{R} solved after {B}' + time + '{R} and now has <{B}' + score + '{R}> points ({B}+' + points + '{R}) on rank {B}' + rank + '{R}.'));
                        channel.say(GLaDOS.clrs('[{B}QUIZ{R}] The answer was: {B}' + quiz.getAnswer()));
                    });
                });
                quiz.delayNewQuestion();
            }
            quiz.resetHaltTimer();
        }
    });
    ircEvent('join', function (channel, user) {
        if (channel.getName() === '#quiz') {
            quiz.isQuizOp(user.getNick(), function (isop) {
                if (isop) {
                    GLaDOS.sendRaw(' MODE #quiz +h ' + user.getNick());
                }
            });
        }
    });
});