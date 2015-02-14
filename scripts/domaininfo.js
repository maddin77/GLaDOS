'use strict';
var request = require('request');
var cheerio = require('cheerio');
var net = require('net');
var _ = require('underscore');
var debug = require('debug')('GLaDOS:script:domaininfo');
var Table = require('easy-table');

module.exports = function (scriptLoader, irc) {
    var formatTitle, formatBlock, sprunge;

    formatTitle = function (str) {
        return '\n\n============================================\n' + str + '\n============================================\n';
    };

    formatBlock = function (block) {
        var t = new Table();
        block.forEach(function (row) {
            t.cell('key', row[0]);
            _.each(row[1].split(/__NEWLINE__/gmi), function (element, index, list) {
                if (!_.isEmpty(element) || (list.length === 1 && _.isEmpty(element))) {
                    t.cell('value', element.replace(/^\s+|\s+$/g, ''));
                    t.newRow();
                }
            });
        });
        return '\n' + t.print();
    };

    sprunge = function (string, fn) {
        request.post({
            url: 'http://sprunge.us',
            form: {
                sprunge: string.trim()
            }
        }, function (error, response, body) {
            fn(error, body.trim());
        });
    };

    scriptLoader.registerCommand('domaininfo', function (event) {
        if (event.params.length > 0) {
            request({
                "uri": 'http://www.tcpiputils.com/inc/api.php?version=1.0&type=domaininfo&hostname=' + event.text + '&source=chromeext',
                "headers": {
                    "User-Agent": irc.config.userAgent
                }
            }, function (error, response, body) {
                if (!error && response.statusCode === 200) {
                    var $ = cheerio.load(body.replace(/<br \/>/gmi, '__NEWLINE__')), string = '';
                    if ($('<div>').html(body).text() === 'No valid domain found!') {
                        event.channel.reply(event.user, 'No valid domain found!');
                    } else {
                        $('.result').each(function () {
                            var block = null;
                            $(this).find('tr').each(function (i) {
                                if ($(this).text().trim().length > 0) {
                                    if (i === 0) {
                                        if ($(this).text() !== 'Graphs' && $(this).text() !== 'DMOZ open directory') {
                                            string += formatTitle($(this).text());
                                            block = [];
                                        }
                                    } else if (block !== null) {
                                        if ($(this).find('td').length > 1) {
                                            var key = $(this).find('td').first().text();
                                            if (key !== 'HTML tools' && key !== 'Network tools (IPv4)' && key !== 'Network tools (IPv6)') {
                                                block.push([key, $(this).find('td').last().text().trim()]);
                                            }
                                        } else {
                                            if ($(this).find('td').attr('colspan') !== '2' || ($(this).find('td').attr('colspan') === '2' && $(this).find('td').attr('style') === "font-size: 80%;")) {
                                                string += '\n' + $(this).text();
                                            }
                                        }
                                    }
                                }
                            });
                            if (block) {
                                string += formatBlock(block);
                            }
                        });
                        sprunge(string, function (err, url) {
                            if (err) {
                                event.channel.reply(event.user, 'Gratz. You broke it. (' + error + ')');
                                debug('[domaininfo] %s', error);
                            } else {
                                event.channel.reply(event.user, url);
                            }
                        });
                    }
                } else {
                    event.channel.reply(event.user, 'Gratz. You broke it. (' + error + ')');
                    debug('[domaininfo] %s', error);
                }
            });
        } else {
            event.user.notice('Use: !domaininfo <domain>');
        }
    });
};