module.exports = function (scriptLoader) {
    scriptLoader.on('command', 'hennertranslate', function (event) {
        var text = event.text.trim().toLowerCase().replace(/[\.,-\/#!$%\^&\*;:{}=\-_`~()]/g, '');
        event.channel.say(text);
    });
};
