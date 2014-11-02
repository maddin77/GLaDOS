var debug = require('debug')('GLaDOS:script:Quiz');
var _ = require('underscore');
var moment = require('moment');
moment.locale('precise-en', {
    'relativeTime' : {
        'future' : 'in %s',
        'past' : '%s ago',
        's' : '%d seconds', //see https://github.com/timrwood/moment/pull/232#issuecomment-4699806
        'm' : 'a minute',
        'mm' : '%d minutes',
        'h' : 'an hour',
        'hh' : '%d hours',
        'd' : 'a day',
        'dd' : '%d days',
        'M' : 'a month',
        'MM' : '%d months',
        'y' : 'a year',
        'yy' : '%d years'
    }
});
moment.locale('precise-en');


var Quiz = function (irc) {
    this.database = irc.database('quiz');
    this.database.score = this.database.score || {};
    this.database.save();

    this.quizdata = require(__dirname + '/quizdata.json');
    this.irc = irc;
    this.rules = [
        'No excessive flooding and scripting',
        'It\'s a privilege, not a right to quiz.'
    ];
    this.running = false;
    this.halted = false;
    this.questioncounter = 1;
    this.question = false;
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
module.exports = Quiz;
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
Quiz.prototype.getScore = function (nick) {
    return parseInt(this.database.score[nick] || 0, 10);
};
Quiz.prototype.addScore = function (nick, score) {
    var _score = this.getScore(nick),
        newScore = this.database.score[nick] = _score + score;
    this.database.save();
    return newScore;
};
Quiz.prototype.setScore = function (nick, score) {
    this.database.score[nick] = score;
    this.database.save();
};
Quiz.prototype.getToplist = function () {
    var _scores = this.database.score,
        scores = [];
    Object.keys(_scores).forEach(function (nick) {
        var score = _scores[nick];
        scores.push({
            'nick': nick,
            'score': score
        });
    });
    scores.sort(function (a, b) {
        return b.score - a.score;
    });
    return scores;
};
Quiz.prototype.getRank = function (nick) {
    var scores = this.getToplist(), i;
    for (i = 0; i < scores.length; i += 1) {
        if (scores[i].nick === nick) {
            return i + 1;
        }
    }
    return scores.length + 1;
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
    return moment(this.quizdata[this.lang].created).format('dddd, MMMM Do YYYY, HH:mm:ss');
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
    if (this.question === null) {
        return false;
    }
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
        var answer, tr;
        answer = this.question.answer.replace(/\#/g, '').toLowerCase();
        answer = answer.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
        tr = {
            'ä': 'ae',
            'ü': 'ue',
            'ö': 'oe',
            'ß': 'ss'
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
        hint = '';
        parts = self.question.answer.replace(/\#/g, '').match(new RegExp('.{1,' + self.MAX_HINTS + '}', 'g'));
        for (p = 0; p < parts.length; p += 1) {
            part = parts[p];
            for (j = 0; j < part.length; j += 1) {
                if (j + 1 <= self.hintcount) {
                    hint += part.charAt(j);
                } else {
                    if (part.charAt(j) === ' ') {
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
Quiz.prototype.delayNewQuestion = function (time) {
    time = time || this.waitDelay;
    if (this.hintTimer) {
        clearTimeout(this.hintTimer);
    }
    var self = this;
    self.waitTimer = setTimeout(function () {
        self.getNewQuestion(function (question, counter, questionString) {
            debug('%j', question);
            self.channel.say(self.irc.clrs('[{B}QUIZ{R}] The question no. {B}' + counter + '{R} is:'));
            self.channel.say(self.irc.clrs('[{B}QUIZ{R}] ' + questionString));
            self.startHints();
        });
    }, time);
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