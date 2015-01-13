var _ = require('underscore');

module.exports = function (scriptLoader) {
    var phrases = [
        'Ich bin ein Rider ich bereue nichts!',
        'Na toll, wegen euch verliere ich wieder die Beherrschung',
        'Leute hat wer Ideen für ZW2:NW?'
    ];

    scriptLoader.on('command', 'rider', function (event) {
        event.channel.say('"' + _.sample(phrases) + '" — [Black]Rider');
    });
};
