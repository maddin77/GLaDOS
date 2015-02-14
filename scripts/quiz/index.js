'use strict';

var moment = require('moment');
var Quiz = require(__dirname + '/Quiz.js');

module.exports = function (scriptLoader, irc) {
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


    var quiz = new Quiz(irc),
        quizChannelName = '#quiz';

    scriptLoader.registerCommand('setscore', function (event) {
        if (irc.config.admin.indexOf(event.user.getNick()) > -1) {
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
    scriptLoader.registerCommand('quiz', function (event) {
        if (event.channel.userHasMode(event.user, '%') || event.channel.userHasMode(event.user, '@') || event.channel.userHasMode(event.user, '&') || event.channel.userHasMode(event.user, '~')) {
            if (event.channel.getName() === quizChannelName) {
                if (event.params.length > 0) {
                    if (event.params[0].toUpperCase() === 'START') {
                        if (!quiz.isRunning()) {
                            if (event.params.length > 1) {
                                var lang = event.params[1];
                                if (quiz.quizdata.hasOwnProperty(lang)) {
                                    quiz.start(lang, event.channel);
                                    event.channel.say(irc.clrs('[{B}QUIZ{R}] {U}' + event.user.getNick() + '{R} started the quiz: {B}' + quiz.getTotalQuestionCount() + '{R} questions in database "' + lang + '" (' + quiz.getQuizdataCreationDate() + ').'));
                                    quiz.delayNewQuestion(0);
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
    scriptLoader.registerCommand('ask', function (event) {
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
    scriptLoader.registerCommand('rules', function (event) {
        if (event.channel.getName() === quizChannelName) {
            quiz.rules.forEach(function (rule) {
                event.user.notice(rule);
            });
        } else {
            event.user.notice('This only works in ' + quizChannelName + '.');
        }
    });
    scriptLoader.registerCommand('rank', function (event) {
        if (event.channel.getName() === quizChannelName) {
            var scores = quiz.getToplist(),
                userscore = {
                    "nick": event.user.getNick(),
                    "score": -1,
                    "index": -1
                },
                index;
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
        } else {
            event.user.notice('This only works in ' + quizChannelName + '.');
        }
    });

    scriptLoader.registerEvent('message', function (event) {
        if (event.channel.getName() === quizChannelName && quiz.isRunning() && !quiz.isHalted()) {
            if (quiz.isRight(event.message)) {
                var question = quiz.getQuestion(),
                    nick = event.user.getNick(),
                    time = moment.duration(quiz.getQuestionTime().diff(moment()), 'milliseconds').humanize(),
                    points = question.score || 1,
                    score = quiz.addScore(nick, points),
                    rank = quiz.getRank(nick);
                question.solved = true;
                event.channel.say(irc.clrs('[{B}QUIZ{R}] {B}' + nick + '{R} solved after {B}' + time + '{R} and now has <{B}' + score + '{R}> points ({B}+' + points + '{R}) on rank {B}' + rank + '{R}.'));
                event.channel.say(irc.clrs('[{B}QUIZ{R}] The answer was: {B}' + quiz.getAnswer()));
                quiz.delayNewQuestion();
            }
            quiz.resetHaltTimer();
        }
    });
};