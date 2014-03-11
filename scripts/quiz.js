'use strict';
var moment = require('moment');
var _ = require('underscore');
var debug = require('debug')('glados:script:quiz');

var Quiz = function (quizdata, irc) {
    this.quizdata = quizdata;
    this.irc = irc;
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
Quiz.prototype.isQuizOp = function (nick, fn) {
    this.irc.brain.sismember('quiz:ops', nick, function (error, isMember) {
        if (error) {
            debug('isQuizOp:%s -> %s', nick, error);
            fn(false);
        } else {
            fn(isMember === 1);
        }
    });
};
Quiz.prototype.opNick = function (nick, cb) {
    var self = this;
    this.isQuizOp(nick, function (isop) {
        if (isop) {
            self.irc.brain.srem('quiz:ops', nick);
        } else {
            self.irc.brain.sadd('quiz:ops', nick);
        }
        cb(!isop);
    });
};
Quiz.prototype.getScore = function (nick, cb) {
    this.irc.brain.hget('quiz:score', nick, function (err, obj) {
        cb(parseInt(obj || 0, 10));
    });
};
Quiz.prototype.addScore = function (nick, score, cb) {
    var self = this;
    this.getScore(nick, function (oldscore) {
        self.irc.brain.hset('quiz:score', nick, oldscore + score);
        if (cb) {
            cb(oldscore + score);
        }
    });
};
Quiz.prototype.setScore = function (nick, score) {
    this.irc.brain.hset('quiz:score', nick, score);
};
Quiz.prototype.getToplist = function (cb) {
    this.irc.brain.hgetall('quiz:score', function (err, obj) {
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
    this.question = _.sample(this.quizdata[this.lang].entries);
    while (this.question.solved === true) {
        this.question = _.sample(this.quizdata[this.lang].entries);
    }
    this.question.solved = false;
    this.questiontime = moment();
    this.questioncounter += 1;
    this.hintcount = 0;
    cb(this.question, this.questioncounter, this.getQuestionString());
};
Quiz.prototype.getTotalQuestionCount = function () {
    return this.quizdata[this.lang].questions;
};
Quiz.prototype.getQuizdataCreationDate = function () {
    return moment(this.quizdata[this.lang].created).format("dddd, MMMM Do YYYY, HH:mm:ss");
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
            debug('regexp: %s', this.question.regexp);
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
            debug('search: %s', answer);
            return true;
        }
        text = text.replace(/[äöüß]/g, function ($0) {
            return tr[$0];
        });
        answer = answer.replace(/[äöüß]/g, function ($0) {
            return tr[$0];
        });

        if (text.search(answer) !== -1) {
            debug('replace: %s', answer);
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
    debug('getHint -> %s | %s', self.hintcount, self.MAX_HINTS);
    if (self.hintcount > self.MAX_HINTS) { //MAX_HINTS
        self.question.solved = true;
        time = moment.duration(self.getQuestionTime().diff(moment()), 'milliseconds').humanize();
        self.channel.say(self.irc.clrs('[{B}QUIZ{R}] Automatically solved after ' + time + '.'));
        self.channel.say(self.irc.clrs('[{B}QUIZ{R}] The answer is: {B}' + self.getAnswer()));
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
        self.channel.say(self.irc.clrs('[{B}QUIZ{R}] Hint: {B}' + hint));
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
            debug('%j', question, question);
            self.channel.say(self.irc.clrs('[{B}QUIZ{R}] The question no. {B}' + counter + '{R} is:'));
            self.channel.say(self.irc.clrs('[{B}QUIZ{R}] ' + questionString));
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
        self.channel.say(self.irc.clrs('[{B}QUIZ{R}] Quiz halted. Say "!ask" for new questions.'));
    }, this.haltDelay);
};

module.exports = function () {
    moment.lang('precise-en', {
        "relativeTime" : {
            "future" : "in %s",
            "past" : "%s ago",
            "s" : "%d seconds", //see https://github.com/timrwood/moment/pull/232#issuecomment-4699806
            "m" : "a minute",
            "mm" : "%d minutes",
            "h" : "an hour",
            "hh" : "%d hours",
            "d" : "a day",
            "dd" : "%d days",
            "M" : "a month",
            "MM" : "%d months",
            "y" : "a year",
            "yy" : "%d years"
        }
    });
    moment.lang('precise-en');


    return function (irc) {
        var quiz = new Quiz(require(__dirname + '/../quizdata.json'), irc),
            quizChannelName = '#quiz';

        irc.command('quizop', function (event) {
            if (event.user.isAdmin()) {
                var nick = event.params.length > 0 ? event.params[0] : event.user.getNick();
                quiz.opNick(nick, function (isOp) {
                    if (isOp) {
                        irc.brain.sadd('quiz:ops', nick);
                        event.channel.reply(event.user, nick + ' is now quizop.');
                        if (event.channel.isUserInChannel(nick)) {
                            irc.mode(quizChannelName, '+h', nick);
                        }
                    } else {
                        event.channel.reply(event.user, nick + ' is no longer quizop.');
                        if (event.channel.isUserInChannel(nick)) {
                            irc.mode(quizChannelName, '-h', nick);
                        }
                    }
                });
            } else {
                event.user.notice('You don\'t have the permissions to use this command.');
            }
        });
        irc.command('setscore', function (event) {
            if (event.user.isAdmin()) {
                if (event.params.length > 0) {
                    var nick, score;
                    if (event.params.length === 1) {
                        nick = event.user.getNick();
                        score = parseInt(event.params[0], 10);
                        if (isNaN(score)) {
                            return event.user.notice('score was NaN.');
                        }
                    } else if (event.params.length === 2) {
                        nick = event.params[0];
                        score = parseInt(event.params[1], 10);
                        if (isNaN(score)) {
                            return event.user.notice('score was NaN.');
                        }
                    }
                    quiz.setScore(nick, score);
                    event.user.notice(irc.clrs(nick + ' now has <{B}' + score + '{R}> points.'));
                } else {
                    event.user.notice('use: !setscore [nick] <score>');
                }
            } else {
                event.user.notice('You don\'t have the permissions to use this command.');
            }
        });
        irc.command('quiz', function (event) {
            quiz.isQuizOp(event.user.getNick(), function (isop) {
                if (isop) {
                    if (event.channel.getName() === quizChannelName) {
                        if (event.params.length > 0) {
                            if (event.params[0].toUpperCase() === 'START') {
                                if (!quiz.isRunning()) {
                                    if (event.params.length > 1) {
                                        var lang = event.params[1];
                                        if (quiz.quizdata.hasOwnProperty(lang)) {
                                            quiz.start(lang, event.channel);
                                            event.channel.say(irc.clrs('[{B}QUIZ{R}] {U}' + event.user.getNick() + '{R} started the quiz: {B}' + quiz.getTotalQuestionCount() + '{R} questions in database "' + lang + '" (' + quiz.getQuizdataCreationDate() + ').'));
                                            quiz.delayNewQuestion();
                                            quiz.resetHaltTimer();
                                        } else {
                                            event.user.notice('I don\'t have any questions in this language.');
                                        }
                                    } else {
                                        event.user.notice('Use: !quiz START <lang>');
                                    }
                                } else {
                                    event.user.notice('The quiz is already running.');
                                }
                            } else if (event.params[0].toUpperCase() === 'STOP') {
                                if (quiz.isRunning()) {
                                    quiz.stop();
                                    event.channel.say(irc.clrs('[{B}QUIZ{R}] Quiz stopped.'));
                                } else {
                                    event.user.notice('The quiz is not running.');
                                }
                            } else if (event.params[0].toUpperCase() === 'HALT') {
                                if (quiz.isRunning()) {
                                    quiz.halt();
                                    event.channel.say(irc.clrs('[{B}QUIZ{R}] Quiz halted. Say "!ask" for new questions.'));
                                } else {
                                    event.user.notice('The quiz is not running.');
                                }
                            } else if (event.params[0].toUpperCase() === 'NEXT') {
                                if (quiz.isRunning()) {
                                    event.channel.say(irc.clrs('[{B}QUIZ{R}] Manually solved after ' + moment.duration(quiz.getQuestionTime().diff(moment()), 'milliseconds').humanize() + ' by ' + event.user.getNick() + '.'));
                                    event.channel.say(irc.clrs('[{B}QUIZ{R}] The answer is: {B}' + quiz.getAnswer()));
                                    quiz.delayNewQuestion();
                                } else {
                                    event.user.notice('The quiz is not running.');
                                }
                            } else {
                                event.user.notice('Use: !quiz <START|STOP|HALT|NEXT>');
                            }
                        } else {
                            event.user.notice('Use: !quiz <START|STOP|HALT|NEXT>');
                        }
                    } else {
                        event.user.notice('This only works in ' + quizChannelName + '.');
                    }
                } else {
                    event.user.notice('You don\'t have the permissions to use this command.');
                }
            });
        });
        irc.command('ask', function (event) {
            if (event.channel.getName() === quizChannelName) {
                if (quiz.isRunning() && !quiz.isHalted()) {
                    event.user.notice(irc.clrs('[{B}QUIZ{R}] The question no. {B}' + quiz.getCounter() + '{R} is:'));
                    event.user.notice(irc.clrs('[{B}QUIZ{R}] ' + quiz.getQuestionString()));
                } else if (quiz.isRunning() && quiz.isHalted()) {
                    quiz.unhalt();
                    event.channel.say(irc.clrs('[{B}QUIZ{R}] Quiz continued. The question no. {B}' + quiz.getCounter() + '{R} is:'));
                    event.channel.say(irc.clrs('[{B}QUIZ{R}] ' + quiz.getQuestionString()));
                } else {
                    event.user.notice('The quiz is not running.');
                }
            } else {
                event.user.notice('This only works in ' + quizChannelName + '.');
            }
        });
        irc.command('rules', function (event) {
            if (event.channel.getName() === quizChannelName) {
                quiz.rules.forEach(function (rule) {
                    event.user.notice(rule);
                });
            } else {
                event.user.notice('This only works in ' + quizChannelName + '.');
            }
        });
        irc.command('rank', function (event) {
            if (event.channel.getName() === quizChannelName) {
                quiz.getToplist(function (scores) {
                    var userscore = {
                        "nick": event.user.getNick(),
                        "score": -1,
                        "index": -1
                    }, index;
                    for (index = 0; index < scores.length; index += 1) {
                        if (index < 5) {
                            if (scores[index].nick === event.user.getNick()) {
                                userscore.score = 0;
                                event.user.notice(irc.clrs('[' + (index + 1) + '] {B}' + scores[index].nick + '{R} - ' + scores[index].score + 'pt'));
                            } else {
                                event.user.notice('[' + (index + 1) + '] ' + scores[index].nick + ' - ' + scores[index].score + 'pt');
                            }
                        } else {
                            if (scores[index].nick === event.user.getNick()) {
                                userscore.score = scores[index].score;
                                userscore.index = index + 1;
                            }
                        }
                    }
                    if (userscore.score !== 0) {
                        if (scores.length > 5 && userscore.index !== 6) {
                            event.user.notice('...');
                        }
                        if (userscore.score === -1) {
                            event.user.notice(irc.clrs('[' + (scores.length + 1) + '] {B}' + userscore.nick + '{R} - 0pt'));
                        } else {
                            event.user.notice(irc.clrs('[' + userscore.index + '] {B}' + userscore.nick + '{R} - ' + userscore.score + 'pt'));
                        }
                    }
                });
            } else {
                event.user.notice('This only works in ' + quizChannelName + '.');
            }
        });

        irc.on('chanmsg', function (event) {
            if (event.channel.getName() === quizChannelName && quiz.isRunning() && !quiz.isHalted()) {
                if (quiz.isRight(event.message)) {
                    var question = quiz.getQuestion(),
                        nick = event.user.getNick(),
                        time = moment.duration(quiz.getQuestionTime().diff(moment()), 'milliseconds').humanize(),
                        points = question.score || 1;
                    question.solved = true;
                    quiz.addScore(nick, points, function (score) {
                        quiz.getRank(nick, function (rank) {
                            event.channel.say(irc.clrs('[{B}QUIZ{R}] {B}' + nick + '{R} solved after {B}' + time + '{R} and now has <{B}' + score + '{R}> points ({B}+' + points + '{R}) on rank {B}' + rank + '{R}.'));
                            event.channel.say(irc.clrs('[{B}QUIZ{R}] The answer was: {B}' + quiz.getAnswer()));
                        });
                    });
                    quiz.delayNewQuestion();
                }
                quiz.resetHaltTimer();
            }
        });
        irc.on('join', function (event) {
            if (event.channel.getName() === quizChannelName) {
                quiz.isQuizOp(event.user.getNick(), function (isOp) {
                    if (isOp) {
                        irc.mode(quizChannelName, '+h', event.user.getNick());
                    }
                });
            }
        });
    };
};