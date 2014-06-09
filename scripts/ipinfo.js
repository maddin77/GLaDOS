'use strict';
var request = require('request');
var cheerio = require('cheerio');
var net = require('net');
var _ = require('underscore');
var debug = require('debug')('GLaDOS:script:ipinfo');
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

    scriptLoader.registerCommand('ipinfo', function (event) {
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
                                var text, key, value;
                                if ($(this).text().trim().length > 0) {
                                    if (i === 0) {
                                        string += formatTitle($(this).text());
                                        block = [];
                                    } else if (block !== null) {
                                        if ($(this).find('td').length > 1) {
                                            key = $(this).find('td').first().text();
                                            value = $(this).find('td').last().text().trim();
                                            if (key !== 'Network tools' && key !== 'Fresh lookup for more domains on this IP.') {
                                                if (value === 'domain info') {
                                                    value = '';
                                                }
                                                block.push([key, value]);
                                            }
                                        } else {
                                            text = $(this).text();
                                            if ($(this).find('td').attr('colspan') !== '2' && text !== 'Fresh lookup for more domains on this IP.') {
                                                if (text.substr(text.split(String.fromCharCode(160))[0].length + 1) === 'domain info') {
                                                    text = text.split(String.fromCharCode(160))[0];
                                                }
                                                string += '\n' + text;
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