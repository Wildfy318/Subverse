/* ═══════════════════════════════════════════
   SUBVERSE — Ambient Music Module
   Uses Tone.js for generative peaceful music
   ═══════════════════════════════════════════ */

const Music = (function(){
  let playing = false, inited = false;
  let synthPad, synthSparkle, reverb, autoFilter, loopPad, loopSparkle;

  // Peaceful chord progressions in various keys
  const chords = [
    ['C4','E4','G4','B4'],     // Cmaj7
    ['A3','C4','E4','G4'],     // Am7
    ['F3','A3','C4','E4'],     // Fmaj7
    ['G3','B3','D4','F#4'],    // Gmaj7
    ['D3','F#3','A3','C#4'],   // Dmaj7
    ['E3','G#3','B3','D#4'],   // Emaj7
    ['Bb3','D4','F4','A4'],    // Bbmaj7
    ['Eb3','G3','Bb3','D4'],   // Ebmaj7
  ];

  // Pentatonic sparkle notes — dreamy, no dissonance
  const sparkleNotes = ['E5','G5','A5','B5','D6','E6','G6','A6','B6','D7'];

  function init(){
    if(inited) return;
    inited = true;

    // Effects chain
    reverb = new Tone.Reverb({ decay: 10, wet: 0.75 }).toDestination();
    autoFilter = new Tone.AutoFilter({
      frequency: 0.06,
      baseFrequency: 180,
      octaves: 4,
      wet: 0.6
    }).connect(reverb).start();

    // Warm pad synth — slow, lush chords
    synthPad = new Tone.PolySynth(Tone.FMSynth, {
      maxPolyphony: 8,
      volume: -20,
      harmonicity: 1.5,
      modulationIndex: 1.2,
      envelope: { attack: 4, decay: 3, sustain: 0.85, release: 6 },
      modulation: { type: 'sine' },
      modulationEnvelope: { attack: 3, decay: 2, sustain: 0.7, release: 5 }
    }).connect(autoFilter);

    // High, gentle sparkle synth
    synthSparkle = new Tone.Synth({
      volume: -26,
      oscillator: { type: 'sine' },
      envelope: { attack: 2, decay: 1.5, sustain: 0.2, release: 4 }
    }).connect(reverb);

    // Deep sub bass — very quiet, adds warmth
    const subBass = new Tone.Synth({
      volume: -30,
      oscillator: { type: 'sine' },
      envelope: { attack: 3, decay: 2, sustain: 0.6, release: 5 }
    }).connect(reverb);

    // Pad loop — cycle through chords
    let chordIndex = 0;
    loopPad = new Tone.Loop(time => {
      const chord = chords[chordIndex % chords.length];
      synthPad.triggerAttackRelease(chord, '5m', time, 0.3);

      // Subtle bass note from the chord root
      const root = chord[0].replace('4','2').replace('3','2');
      subBass.triggerAttackRelease(root, '4m', time, 0.15);

      chordIndex++;
    }, '4m');

    // Sparkle loop — random gentle notes
    loopSparkle = new Tone.Loop(time => {
      if(Math.random() > 0.3){
        const note = sparkleNotes[Math.floor(Math.random() * sparkleNotes.length)];
        const vel = Math.random() * 0.25 + 0.05;
        synthSparkle.triggerAttackRelease(note, '2n', time, vel);
      }
    }, '2n');

    Tone.Transport.bpm.value = 45;
  }

  async function toggle(){
    if(!inited) init();

    if(!playing){
      await Tone.start();
      Tone.Transport.start();
      loopPad.start(0);
      loopSparkle.start('2m');
      playing = true;
    } else {
      Tone.Transport.pause();
      playing = false;
    }
    return playing;
  }

  function isPlaying(){ return playing; }

  return { toggle, isPlaying };
})();
