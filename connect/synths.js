

import { SuperSonic } from "https://unpkg.com/supersonic-scsynth@0.81.0/dist/supersonic.js";

const CDN = "https://unpkg.com/";   // or "https://cdn.jsdelivr.net/npm/"
const supersonic = new SuperSonic({
  mode: "postMessage",   // a CDN cannot send the COOP/COEP headers the SAB transport needs
  baseURL:         CDN + "supersonic-scsynth@0.81.0/dist/",              // client, workers
  coreBaseURL:     CDN + "supersonic-scsynth-core@0.81.0/",              // engine wasm, AudioWorklet
  wasmBaseURL:     CDN + "supersonic-scsynth-core@0.81.0/wasm/",         // needed up to 0.81.0, see below
  synthdefBaseURL: CDN + "supersonic-scsynth-synthdefs@0.81.0/synthdefs/",
  sampleBaseURL:   CDN + "supersonic-scsynth-samples@0.81.0/samples/",
});
await supersonic.init();
await supersonic.loadSynthDef('sonic-pi-prophet');
// await start();
// supersonic.send("/s_new", "sonic-pi-prophet", -1, 0, 0, "note", 28, "amp", 0.5,  "attack", 2, "release", 8, "cutoff", 70);

// supersonic.send("/s_new", "sonic-pi-prophet", -1, 0, 0, "note", 32, "amp", 0.4, "attack", 2, "release", 12, "cutoff", 50);

// supersonic.send("/s_new", "sonic-pi-prophet", -1, 0, 0, "note", 42, "amp", 0.3, "attack", 2, "release", 10, "cutoff", 80);

     // 4. Define our loop parameters
      const notes = [60, 63, 65, 67, 70, 67, 65, 63]; // A simple note pattern (MIDI values)
      let currentIndex = 0;
      const loopSpeedMs = 10000; // Play a note every 250ms (120 BPM sixteenth notes)
        supersonic.send("/s_new", "sonic-pi-prophet", -1, 0, 0, "note", 28, "amp", 0.5,  "attack", 2, "release", 8, "cutoff", 70);

        supersonic.send("/s_new", "sonic-pi-prophet", -1, 0, 0, "note", 32, "amp", 0.4, "attack", 2, "release", 12, "cutoff", 50);

        supersonic.send("/s_new", "sonic-pi-prophet", -1, 0, 0, "note", 42, "amp", 0.3, "attack", 2, "release", 10, "cutoff", 80);
      // 5. Start the looping mechanism
        // setInterval(() => {
        //     const currentNote = notes[currentIndex];
            
        //     // Send an OSC message to spawn a new synth node
        //     // Arguments: Command, SynthDef Name, Node ID (-1 auto-assigns), Target, Action, ...Parameters
        //     // supersonic.send('/s_new', 'sonic-pi-prophet', -1, 0, 0, 'note', currentNote, 'amp', 0.5);
        //     supersonic.send("/s_new", "sonic-pi-prophet", -1, 0, 0, "note", 28, "amp", 0.5,  "attack", 2, "release", 8, "cutoff", 70);

        //     supersonic.send("/s_new", "sonic-pi-prophet", -1, 0, 0, "note", 32, "amp", 0.4, "attack", 2, "release", 12, "cutoff", 50);

        //     supersonic.send("/s_new", "sonic-pi-prophet", -1, 0, 0, "note", 42, "amp", 0.3, "attack", 2, "release", 10, "cutoff", 80);
            
        //     // Move to the next note in the array, or wrap around to the beginning
        //     currentIndex = (currentIndex + 1) % notes.length;
        // }, loopSpeedMs);



let sonic = null;
let isPlaying = false;
let timerId = null;

// --- Initialize SuperSonic ---
async function initAudio() {
  if (sonic == null) {
    // toggleBtn.textContent = "Booting Synth Engine...";
    
    // Boot scsynth inside an AudioWorklet via CDN
    sonic = new SuperSonic({
      sampleBaseURL: 'https://unpkg.com/supersonic-scsynth-samples@latest/samples/'
    });
    await sonic.init();

    // Load a built-in Sonic Pi synth definition 
    await sonic.loadSynthDef('sonic-pi-piano');
  }
}



// --- Timing Configuration ---
const bpm = 120;
const beatDuration = 60 / bpm; // 0.5 seconds per beat
const lookAheadTime = 0.1;     // How far ahead to schedule (100ms)
const scheduleInterval = 35;   // How often to run the scheduler loop (35ms)

let nextNoteTime = 0.0;        // When the next note should play (relative to AudioContext)
let beatCount = 0;


// --- The Look-Ahead Scheduler Loop ---
function scheduler() {
  const currentTime = sonic.audioContext.currentTime;

  // While there are notes that will play before the look-ahead window closes
  while (nextNoteTime < currentTime + lookAheadTime) {
    scheduleSynth(beatCount, nextNoteTime);
    advanceNote();
  }
}

// --- Advance to the next beat ---
function advanceNote() {
  nextNoteTime += beatDuration;
  beatCount = (beatCount + 1) % 4; // 4-beat pattern loop (0, 1, 2, 3)
}

// --- Send the OSC message with a precise timestamp ---
function scheduleSynth(beat, time) {
  // Simple step sequencer melody (MIDI notes)
  const pattern = [60, 63, 65, 67]; // C4, D#4, F4, G4
  const noteToPlay = pattern[beat];

  // Send native scsynth /s_new OSC bundle targeting a specific timestamp
  // Arguments: command, synthDefName, nodeId, action, targetId, parameters...
  sonic.sendAtTime(time, '/s_new', 'sonic-pi-piano', -1, 0, 1, 'note', noteToPlay, 'amp', 0.5);
}

// --- Control Toggles ---
async function start() {
  await initAudio();
  
  isPlaying = true;
//   toggleBtn.textContent = "Stop Loop";
  
  // Align the start time with the context clock
  nextNoteTime = sonic.audioContext.currentTime + 0.05; 
  beatCount = 0;
  
  // Start the ticking interval clock
  timerId = setInterval(scheduler, scheduleInterval);
}