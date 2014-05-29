'use strict';
var request = require('request');
var cheerio = require('cheerio');
var net = require('net');
var _ = require('underscore');
var debug = require('debug')('GLaDOS:script:ipinfo');
var Table = require('cli-table');

/* TODO
    filter this shit $('a[href^="http://www.tcpiputils.com/browse/domain/]')
*/

module.exports = function (irc) {
    var formatTitle, formatBlock, sprunge;

    formatTitle = function (str) {
        return '\n\n============================================\n' + str + '\n============================================\n';
    };

    formatBlock = function (block) {
        var table = new Table({
            chars: {
                'top': '',
                'top-mid': '',
                'top-left': '',
                'top-right': '',
                'bottom': '',
                'bottom-mid': '',
                'bottom-left': '',
                'bottom-right': '',
                'left': '',
                'left-mid': '',
                'mid': '',
                'mid-mid': '',
                'right': '',
                'right-mid': '',
                'middle': ' '
            },
            style: {
                'padding-left': 1,
                'padding-right': 1,
                head: [],
                border: []
            },
            colAligns: ['right', 'left']
        });
        block.forEach(function (row) {
            row[1] = row[1].replace(/__NEWLINE__/gmi, '\n').replace(/^\s+|\s+$/g, '');
            table.push(row);
        });
        return '\n' + table.toString();
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

    irc.command('ipinfo', function (event) {
        if (event.params.length > 0) {
            var ip = event.text,
                ret = net.isIP(ip),
                url = '';
            if (ret !== 0) {
                if (ret === 4) {
                    url = 'http://www.tcpiputils.com/inc/api.php?version=1.0&type=ipv4info&hostname=' + ip + '&source=chromeext';
                } else if (ret === 6) {
                    url = 'http://www.tcpiputils.com/inc/api.php?version=1.0&type=ipv6info&hostname=' + ip + '&source=chromeext';
                }
                request({
                    "uri": url,
                    "headers": {
                        "User-Agent": irc.config.userAgent
                    }
                }, function (error, response, body) {
                    if (!error && response.statusCode === 200) {
                        var $ = cheerio.load(body.replace(/<br \/>/gmi, '__NEWLINE__')), string = '';
                        $('.result').each(function () {
                            var block = null;
                            $(this).find('tr').each(function (i) {
                                if ($(this).text().trim().length > 0) {
                                    if (i === 0) {
                                        string += formatTitle($(this).text());
                                    } else {
                                        if ($(this).find('td').length > 1) {
                                            block = block || [];
                                            block.push([$(this).find('td').first().text(), $(this).find('td').last().text().trim()]);
                                        } else {
                                            if ($(this).find('td').attr('colspan') !== '2') {
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
                                debug('[ipinfo] %s', error);
                            } else {
                                event.channel.reply(event.user, url);
                            }
                        });
                    } else {
                        event.channel.reply(event.user, 'Gratz. You broke it. (' + error + ')');
                        debug('[ipinfo] %s', error);
                    }
                });
            } else {
                event.channel.reply(event.user, '"' + event.text + '" is not a valid ip.');
            }
        } else {
            event.user.notice('Use: !ipinfo <ip>');
        }
    });
};