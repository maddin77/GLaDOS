// Description:
//   None
//
// Dependencies:
//   "htmlparser": "1.7.6"
//   "soupselect": "0.2.0"
//
// Configuration:
//   HUBOT_9GAG_NO_GIFS (optional, skips GIFs if defined; default is undefined)
//
// Commands:
//   hubot 9gag me - Returns a random meme image
//
// Author:
//   EnriqueVidal
//
// Contributors:
//   dedeibel (gif support)

module.exports = function (glados) {
    glados.hear(/^!test/, function (event, next) {
        event.reply('Yo');
    });
    glados.hear(/^!test/, function (event) {
        event.reply('Yo');
    });
};