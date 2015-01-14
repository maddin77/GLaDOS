var _ = require('underscore');

module.exports = function (scriptLoader) {
    var phrases = [
        'Ich bin ein Rider ich bereue nichts!',
        'Na toll, wegen euch verliere ich wieder die Beherrschung',
        'Leute hat wer Ideen für ZW3:NW?',
        'Ich hab mit ZW2:NW mehr erreicht als du in deinem leben, würd ich sagen',
        'Leck mich doch am Asphalt',
        'lasst mich einfach in ruhe und fertig, mehr will ich nicht',
        'ich benutze SAMP als hintergrund, während ich am Laptop schreibe.',
        'ICH BIN EIN STÜCK SCHEIßE! WEN INTERESSIERTS OB ICH LEBE ODER NICHT',
        'ich bin aufm server hier eh immer ne lachnummer',
        'ich hab nen nervenzusammenbruch. Und ihr macht euch einfach lustig drüber',
        'ey wisst ihr was ich schreib nen abschiedsbrief, und mach den server für meinen selbstmord veratnwrotlich',
        'kein arsch freut sich wenn ich On komme'
    ];

    scriptLoader.on('command', 'rider', function (event) {
        event.channel.say('"' + _.sample(phrases) + '" — [Black]Rider');
    });
};
