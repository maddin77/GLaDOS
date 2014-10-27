var request = require('request');
var cheerio = require('cheerio');
var net     = require('net');
var _       = require('underscore');
var Table   = require('easy-table');

module.exports = function (scriptLoader) {
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
            },
            headers: {
                'User-Agent': scriptLoader.connection.config.userAgent
            }
        }, function (error, response, body) {
            fn(error, body.trim());
        });
    };

    scriptLoader.on('command', 'ipinfo', function (event) {
        if (event.params.length > 0) {
            var ip = event.text.trim(),
                ret = net.isIP(ip),
                url = '';
            if (ret !== 0) {
                if (ret === 6) {
                    url = 'http://www.tcpiputils.com/inc/api.php?version=1.0&type=ipv6info&hostname=' + ip + '&source=chromeext';
                } else  {
                    url = 'http://www.tcpiputils.com/inc/api.php?version=1.0&type=ipv4info&hostname=' + ip + '&source=chromeext';
                }
                request({
                    'uri': url,
                    'headers': {
                        'User-Agent': scriptLoader.connection.config.userAgent
                    }
                }, function (error, response, body) {
                    if (!error && response.statusCode === 200) {
                        var $ = cheerio.load(body.replace(/<br \/>/gmi, '__NEWLINE__')), string = '';
                        $('.row > div:not(.adboxcontentbrowse)').each(function () {
                            var title = $(this).find('h2').text().trim(),
                                block = [];
                            if (title) {
                                string += formatTitle(title);
                                $(this).find('table tr').each(function () {
                                    var key = $(this).find('td').first().text().trim();
                                    if ($(this).find('td').length > 1) {
                                        if (key !== 'Network tools') {
                                            block.push([key, $(this).find('td').last().text().trim()]);
                                        }
                                    } else {
                                        if (key === 'No domains found.') {
                                            string += '\nNo domains found.';
                                        }
                                    }
                                });
                            }
                            if (block.length > 0) {
                                string += formatBlock(block);
                            }
                        });
                        sprunge(string, function (err, url) {
                            if (err) {
                                event.channel.reply(event.user, 'Gratz. You broke it. (' + error + ')');
                                scriptLoader.debug('sprunge error: %s', error);
                            } else {
                                event.channel.reply(event.user, url);
                            }
                        });
                    } else {
                        error = error || ('HTTP ' + response.statusCode);
                        event.channel.reply(event.user, 'Gratz. You broke it. (' + error + ')');
                        scriptLoader.debug('reqeust error: %s', error);
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