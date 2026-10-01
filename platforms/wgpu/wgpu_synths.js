
import * as Tonal from 'tonal';
import { SuperSonic } from "https://unpkg.com/supersonic-scsynth@0.81.0/dist/supersonic.js";
import * as THREE from 'three/webgpu';

import { Line2 } from 'three/addons/lines/webgpu/Line2.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';

// import { Line2NodeMaterial } from 'three/addons/lines/Line2NodeMaterial.js';

// import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
// import * as Tonal from '@tonaljs/tonal';
import { Text } from 'three-text/three'; //not troika! https://github.com/countertype/three-text
Text.setHarfBuzzPath('/fonts/hb.wasm'); //!
Text.init();
import { scene } from './wgpu_main.mjs';
import { activeObjex } from './wgpu_locations.js';
import { lookAtCameraObjects, ThreeDeeText } from './wgpu_ui.js';
import { lastRaycastHitPosition, lastRaycastHitObject } from './wgpu_controls.js';
import { instancedMesh } from 'three/tsl';

export let superSonicLoaded = false;

export let synthTransport;
let supersonic;
// let synthDef1 = 'sonic-pi-prophet';
let synthDef1 = 'sonic-pi-mod_pulse';

let synthDef2 = 'sonic-pi-prophet';
let synthDefs = ['sonic-pi-mod_pulse','sonic-pi-prophet','sonic-pi-blade','sonic-pi-fm','sonic-pi-bass_foundation','sonic-pi-organ_tonewheel','sonic-pi-gabberkick','sonic-pi-rhodey', 'sonic-pi-piano' ]
let synth1;

let nodeCount = 0;
let nodeID;

let sonic = null;
let isPlaying = false;
let timerId = null;
let selectedKey;

const uiMaterial = new THREE.MeshBasicMaterial({color: 'white'});

export let synthKeys = {};

export const SYNTHDEF_NAMES = [
  "fft_brickwall",
  "fft_magfreeze",
  "fft_passthrough",
  "fft_size_1024",
  "fft_size_4096",
  "fft_size_512",
  "fft_test_sine",
  "number",
  "simple_passthrough",
  "sonic-pi-amp_stereo_monitor",
  "sonic-pi-basic_mixer",
  "sonic-pi-basic_mono_player",
  "sonic-pi-basic_stereo_player",
  "sonic-pi-bass_foundation",
  "sonic-pi-bass_highend",
  "sonic-pi-beep",
  "sonic-pi-blade",
  "sonic-pi-bnoise",
  "sonic-pi-chipbass",
  "sonic-pi-chiplead",
  "sonic-pi-chipnoise",
  "sonic-pi-cnoise",
  "sonic-pi-dark_ambience",
  "sonic-pi-dpulse",
  "sonic-pi-dsaw",
  "sonic-pi-dtri",
  "sonic-pi-dull_bell",
  "sonic-pi-fm",
  "sonic-pi-fx_autotuner",
  "sonic-pi-fx_band_eq",
  "sonic-pi-fx_bitcrusher",
  "sonic-pi-fx_bpf",
  "sonic-pi-fx_compressor",
  "sonic-pi-fx_distortion",
  "sonic-pi-fx_echo",
  "sonic-pi-fx_eq",
  "sonic-pi-fx_flanger",
  "sonic-pi-fx_gverb",
  "sonic-pi-fx_hpf",
  "sonic-pi-fx_ixi_techno",
  "sonic-pi-fx_krush",
  "sonic-pi-fx_level",
  "sonic-pi-fx_lpf",
  "sonic-pi-fx_mono",
  "sonic-pi-fx_nbpf",
  "sonic-pi-fx_nhpf",
  "sonic-pi-fx_nlpf",
  "sonic-pi-fx_normaliser",
  "sonic-pi-fx_nrbpf",
  "sonic-pi-fx_nrhpf",
  "sonic-pi-fx_nrlpf",
  "sonic-pi-fx_octaver",
  "sonic-pi-fx_pan",
  "sonic-pi-fx_panslicer",
  "sonic-pi-fx_ping_pong",
  "sonic-pi-fx_pitch_shift",
  "sonic-pi-fx_rbpf",
  "sonic-pi-fx_record",
  "sonic-pi-fx_reverb",
  "sonic-pi-fx_rhpf",
  "sonic-pi-fx_ring_mod",
  "sonic-pi-fx_rlpf",
  "sonic-pi-fx_scope_out",
  "sonic-pi-fx_slicer",
  "sonic-pi-fx_sound_out",
  "sonic-pi-fx_sound_out_stereo",
  "sonic-pi-fx_tanh",
  "sonic-pi-fx_tremolo",
  "sonic-pi-fx_vowel",
  "sonic-pi-fx_whammy",
  "sonic-pi-fx_wobble",
  "sonic-pi-gabberkick",
  "sonic-pi-gnoise",
  "sonic-pi-growl",
  "sonic-pi-hollow",
  "sonic-pi-hoover",
  "sonic-pi-kalimba",
  "sonic-pi-link_audio_stereo",
  "sonic-pi-live_audio",
  "sonic-pi-live_audio_mono",
  "sonic-pi-live_audio_stereo",
  "sonic-pi-mixer",
  "sonic-pi-mixout",
  "sonic-pi-mod_dsaw",
  "sonic-pi-mod_fm",
  "sonic-pi-mod_pulse",
  "sonic-pi-mod_saw",
  "sonic-pi-mod_sine",
  "sonic-pi-mod_tri",
  "sonic-pi-mono_player",
  "sonic-pi-noise",
  "sonic-pi-organ_tonewheel",
  "sonic-pi-piano",
  "sonic-pi-pluck",
  "sonic-pi-pnoise",
  "sonic-pi-pretty_bell",
  "sonic-pi-prophet",
  "sonic-pi-pulse",
  "sonic-pi-rhodey",
  "sonic-pi-rodeo",
  "sonic-pi-saw",
  "sonic-pi-sc808_bassdrum",
  "sonic-pi-sc808_clap",
  "sonic-pi-sc808_claves",
  "sonic-pi-sc808_closed_hihat",
  "sonic-pi-sc808_congahi",
  "sonic-pi-sc808_congalo",
  "sonic-pi-sc808_congamid",
  "sonic-pi-sc808_cowbell",
  "sonic-pi-sc808_cymbal",
  "sonic-pi-sc808_maracas",
  "sonic-pi-sc808_open_hihat",
  "sonic-pi-sc808_rimshot",
  "sonic-pi-sc808_snare",
  "sonic-pi-sc808_tomhi",
  "sonic-pi-sc808_tomlo",
  "sonic-pi-sc808_tommid",
  "sonic-pi-scope",
  "sonic-pi-server-info",
  "sonic-pi-sound_in",
  "sonic-pi-sound_in_stereo",
  "sonic-pi-square",
  "sonic-pi-stereo_player",
  "sonic-pi-subpulse",
  "sonic-pi-supersaw",
  "sonic-pi-tb303",
  "sonic-pi-tech_saws",
  "sonic-pi-tri",
  "sonic-pi-zawa",
  "test_offset_out",
  "u_cmd_test",
];

const CDN = "https://unpkg.com/";   // or "https://cdn.jsdelivr.net/npm/"

const spatialSynth = {
  name: "spatialOscillator",
  ugen: "Out",
  // Output to bus 0 (your speakers)
  args: [0, {
    ugen: "Pan2",
    args: [
      // The Sound Source: A smooth electronic note
      {
        ugen: "SinOsc",
        args: [440, 0] // 440Hz Frequency
      },
      // The Pan control: dynamically changed by the listener mapping
      { ugen: "Control", name: "pan", defaultValue: 0 },
      // Volume level
      0.3
    ]
  }]
};


export async function InitSuperSonic () {

  supersonic = new SuperSonic({
    mode: "postMessage",   // a CDN cannot send the COOP/COEP headers the SAB transport needs
    baseURL:         CDN + "supersonic-scsynth@0.81.0/dist/",              // client, workers
    coreBaseURL:     CDN + "supersonic-scsynth-core@0.81.0/",              // engine wasm, AudioWorklet
    wasmBaseURL:     CDN + "supersonic-scsynth-core@0.81.0/wasm/",         // needed up to 0.81.0, see below
    synthdefBaseURL: CDN + "supersonic-scsynth-synthdefs@0.81.0/synthdefs/",
    sampleBaseURL:   CDN + "supersonic-scsynth-samples@0.81.0/samples/",
  });

  await supersonic.init();
  for (let i = 0; i < synthDefs.length; i++) {
      await supersonic.loadSynthDef(synthDefs[i]);
  }
  // await supersonic.loadSynthDef(synthDef1);
  //   await supersonic.loadSynthDef(synthDef2);
  superSonicLoaded = true;

  // setInterval(() => {
  //   const tree = supersonic.getTree();
  //   nodeCount = tree.nodeCount;
    // console.log(tree.nodeCount);
// {
//   version: 42,        // Increments on every change
//   nodeCount: 5,       // Total nodes
//   droppedCount: 0,    // Overflow (capacity exceeded)
//   root: { ... }       // Hierarchical TreeNode (always id 0)
// }
    // const metrics = supersonic.getMetrics();

    // console.log(metrics.numNodes);
    // // Check for problems
    // if (metrics.scsynthMessagesDropped > 0) {
    //   console.warn('Messages being dropped!');
    // }

    // // Monitor buffer usage
    // if (metrics.inBufferUsed?.percentage > 80) {
    //   console.warn('Input buffer getting full:', metrics.inBufferUsed.percentage + '%');
    // }

    // Track throughput
    // console.log(`Processed: ${metrics.scsynthMessagesProcessed}, Sent: ${metrics.oscOutMessagesSent}`);
  // }, 100);
    const synthIndex = Math.floor(Math.random() * synthDefs.length);
    supersonic.send("/s_new", synthDefs[synthIndex], -1, 0, 0, "note", 28, "amp", 0.5,  "attack", 1, "release", 5, "cutoff", 70);

    // supersonic.send("/s_new", "sonic-pi-prophet", -1, 0, 0, "note", 32, "amp", 0.4, "attack", 2, "release", 12, "cutoff", 50);

    // supersonic.send("/s_new", "sonic-pi-prophet", -1, 0, 0, "note", 42, "amp", 0.3, "attack", 2, "release", 10, "cutoff", 80);

}


export function LoopSuperSonic () {
    const notes = [60, 63, 65, 67, 70, 67, 65, 63]; // A simple note pattern (MIDI values)
    let currentIndex = 0;
    const loopSpeedMs = 10000; // Play a note every 250ms (120 BPM sixteenth notes)

    setInterval(() => {
        const currentNote = notes[currentIndex];
        
        supersonic.send("/s_new", "sonic-pi-prophet", -1, 0, 0, "note", 28, "amp", 0.5,  "attack", 2, "release", 8, "cutoff", 70);

        supersonic.send("/s_new", "sonic-pi-prophet", -1, 0, 0, "note", 32, "amp", 0.4, "attack", 2, "release", 12, "cutoff", 50);

        supersonic.send("/s_new", "sonic-pi-prophet", -1, 0, 0, "note", 42, "amp", 0.3, "attack", 2, "release", 10, "cutoff", 80);
        
        // Move to the next note in the array, or wrap around to the beginning
        currentIndex = (currentIndex + 1) % notes.length;
    }, loopSpeedMs);
}

     // 4. Define our loop parameters
 
const clamp = (num, min, max) => Math.min(Math.max(num, min), max);

function getRandomInt(min, max) {
  const minCeiled = Math.ceil(min);
  const maxFloored = Math.floor(max);
  // The maximum is exclusive and the minimum is inclusive
  return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled);
}

function getPercentageOf(percent, total) {
  return (percent / 100) * total;
}
export async function SynthHit(position, volFactor, distance, note, chord) {

    // await supersonic.loadSynthDef(synthDef1);

    if (supersonic && superSonicLoaded) {

       
        const tree = supersonic.getTree();
        const nodeCount = tree.nodeCount;
        console.log(nodeCount);
      if (nodeCount < 13) {
          //   console.log('Count:', metrics.scsynthProcessCount);


          // const notes = [32, 34, 38, 42, 44, 48, 52, 60];

          // const noteIndex = Math.floor(Math.random() * notes.length);
        if (!note && !chord) {
          if (!volFactor) {
            volFactor = Math.random();
          }
          const note = getRandomInt(22, 76);
          volFactor = (volFactor * .001);
          volFactor = volFactor * (getPercentageOf(distance, 100) * .01)
          // - (distance * .001);
          
          volFactor = clamp(volFactor, .1, .5);
          // console.log("tryna play note with volFactor " + volFactor + " loaded " + superSonicLoaded);
          // console.log(notes[noteIndex] + " tryna play note with volFactor " + volFactor + " loaded " + superSonicLoaded);
          // await supersonic.loadSynthDef(synthDef1);
          const synthIndex = Math.floor(Math.random() * synthDefs.length);
          const cutoffValue = getRandomInt(30,80);
          


          supersonic.send("/s_new", synthDefs[synthIndex], -1, 0, 0, "note", note, "amp", volFactor, "attack", .2, "release", 1, "cutoff", cutoffValue);
        } else if (chord) {
            console.log("tryna play chord " + chord);
            volFactor = .5;
              supersonic.send("/s_new", synthDefs[5], -1, 0, 0, "note", chord[0], "amp", volFactor, "attack", .2, "release", 1, "sustain", 1, "cutoff", 80);

              supersonic.send("/s_new", synthDefs[5], -1, 0, 0, "note", chord[1], "amp", volFactor, "attack", .2, "release", 1, "sustain", 1, "cutoff", 80);

              supersonic.send("/s_new", synthDefs[5], -1, 0, 0, "note", chord[2], "amp", volFactor, "attack", .2, "release", 1, "sustain", 1, "cutoff", 80);

              supersonic.send("/s_new", synthDefs[5], -1, 0, 0, "note", chord[3], "amp", volFactor, "attack", .2, "release", 1, "sustain", 1, "cutoff", 80);
              
        }
      }
        // console.log("Processed:" + metrics.scsynthMessagesProcessed);
      // }
    }
}


function applyPitchBend(nodeId, targetFreq) {
    // '/n_set' targets a specific running node and updates its arguments instantly

    supersonic.sendOSC("/n_set", [nodeId, "freq", targetFreq]);
}


export async function SynthMod () {
    if (supersonic && superSonicLoaded) {

       
      const tree = supersonic.getTree();
      const nodeCount = tree.nodeCount;
      console.log(nodeCount);

      nodeID = supersonic.nextNodeId(); //

      if (!volFactor) {
            volFactor = Math.random();
          }
          const note = getRandomInt(22, 76);
          volFactor = (volFactor * .001);
          volFactor = volFactor * (getPercentageOf(distance, 100) * .01)
          // - (distance * .001);
          
          volFactor = clamp(volFactor, .1, .5);
          // console.log("tryna play note with volFactor " + volFactor + " loaded " + superSonicLoaded);
          // console.log(notes[noteIndex] + " tryna play note with volFactor " + volFactor + " loaded " + superSonicLoaded);
          // await supersonic.loadSynthDef(synthDef1);
          const synthIndex = Math.floor(Math.random() * synthDefs.length);
          const cutoffValue = getRandomInt(30,80);
          


          supersonic.send("/s_new", synthDefs[synthIndex], nodeID, 0, 0, "note", note, "amp", volFactor, "attack", .2, "release", 1, "cutoff", cutoffValue);
  }
}



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

async function SetText (textString, x,y,z) {
     // static async create(url) {
      const text = await Text.create({
                        // width: 1,
                        text: textString,
                        font: '../../fonts/web/Acme.woff',
                        depth: 0.02,
                        // align: 'left',
                        size: .25,
                        // size: size,
                        removeOverlaps: true,
                        layout: {
                            width: 1,
                            align: 'center'
                        }
                    });

                    const textmesh = new THREE.Mesh(text.geometry, uiMaterial);
                               
                    textmesh.name = "textmesh";
                    textmesh.position.set(x, y, z);
                    scene.add(textmesh);
                    lookAtCameraObjects.push(textmesh);
                    // textmesh.lookAt(camera)
}

export class SynthKeys { 
  constructor(options) {
    let tonics = ["A","A#","Ab","B","B#","Bb","C","C#","D","D#","Db","E","E#","Eb","F","F#","Fb","G","G#","Gb"];
    let types = ["major", "minor", "minor7"];


    let majorKeys = ["C","G","D","A","E","B","F#","Db","Ab","Eb","Fb","F"];//,"E#","Eb","F","F#","Fb","G","G#","Gb"];
    let minorKeys = ["A","E","B","F#","C#","Ab","Eb","Bb","F","C","G","D"];
    
    let count = types.length * tonics.length;
    if (options.mode = "circle of fifths") {
      count = majorKeys.length + minorKeys.length;
    } 

    const geo = new THREE.SphereGeometry(.35,16,10);
    const mat = new THREE.MeshStandardMaterial({transparent: true, color: 'blue', roughness: .1, opacity: .5});
    // const mesh = new THREE.Mesh(geo, mat);
    const iMesh = new THREE.InstancedMesh(geo, mat, count);
    scene.add(iMesh);
    iMesh.userData = {};
    iMesh.userData.locationData = {};
    iMesh.userData.locationData.name = "synthKeys";
    iMesh.userData.locationData.markerType = "synth keys";
    activeObjex.push(iMesh);
    
    synthKeys[0] = this; //for now...

    this.iMesh = iMesh;
    const dummy = new THREE.Object3D();
    this.keymap = [];
    let k = -1;
    let m = -1;
    let n = -1;


    this.keyData = {};
    let radius = 12;
    if (options.mode = "circle of fifths") {
      // for (let m = 0; m < majorKeys.length; m++) {
      //   radius = 6;
      //   const angle = (m / majorKeys.length) * Math.PI * 2;
      //   const x = Math.cos(angle) * radius;
      //   const z = Math.sin(angle) * radius;
      //   dummy.position.set(x, 1, z);
      //   dummy.updateMatrix();
      //   iMesh.setMatrixAt(k, dummy.matrix);
      //   let key = {}
      //   key.keytonic = majorKeys[m];
      //   key.keytype = "major";
      //   key.position = new THREE.Vector3(x, 1, z);
      //   this.keyData[k] = key;
      //   SetText(majorKeys[m] + " " + "major", x, 1.35, z);
      //   k++;
        
      // }
      for (const ikey in majorKeys) {
          k++;
          m++;
        radius = 6;
        const angle = (m / majorKeys.length) * Math.PI * 2;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        dummy.position.set(x, 1, z);
        dummy.updateMatrix();
        iMesh.setMatrixAt(k, dummy.matrix);
        let key = {}
        key.keytonic = majorKeys[m];
        key.keytype = "major";
        key.position = new THREE.Vector3(x, 1, z);
        this.keyData[k] = key;
        SetText(majorKeys[m] + " " + "major", x, 1.35, z);
        // if (k == 12) {
        //   console.log("gotsa id of 12");
        // }
        console.log("major key id of " + k);

      }
      for (const iKey2 in minorKeys) {
          k++;
          n++
        radius = 4;
        const angle = (n / minorKeys.length) * Math.PI * 2;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        dummy.position.set(x, 1, z);
        dummy.updateMatrix();
        iMesh.setMatrixAt(k, dummy.matrix);
        let key = {}
        key.keytonic = minorKeys[n];
        key.keytype = "minor";
        key.position = new THREE.Vector3(x, 1, z);
        this.keyData[k] = key;
        SetText(minorKeys[n] + " " + "minor", x, 1.35, z);
        // if (k == 12) {
          console.log("minor key id of " + k);
        // }
        // k++;
      }
      // for (let n = 0; n < minorKeys.length; n++) {
      //   radius = 4;
      //   const angle = (n / minorKeys.length) * Math.PI * 2;
      //   const x = Math.cos(angle) * radius;
      //   const z = Math.sin(angle) * radius;
      //   dummy.position.set(x, 1, z);
      //   dummy.updateMatrix();
      //   iMesh.setMatrixAt(k, dummy.matrix);
      //   let key = {}
      //   key.keytonic = minorKeys[n];
      //   key.keytype = "minor";
      //   key.position = new THREE.Vector3(x, 1, z);
      //   this.keyData[k] = key;
      //   SetText(minorKeys[n] + " " + "minor", x, 1.35, z);
      //   k++;
      // }
    } else {
      
      for (let i = 0; i < tonics.length; i++) {
        for (let n = 0; n < types.length; n++) {
        const angle = (i / tonics.length) * Math.PI * 2;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        dummy.position.set(x, n + 1, z);
        dummy.updateMatrix();
        iMesh.setMatrixAt(k, dummy.matrix);
        let key = {}
        key.keytonic = tonics[i];
        key.keytype = types[n];
        key.position = new THREE.Vector3(x, n + 1, z);
        this.keyData[k] = key;
        SetText(tonics[i] + " " + types[n], x, n + 1.35, z);
        k++;

        }
      }
    
    }
      iMesh.instanceMatrix.needsUpdate = true;
      const transportFatline = new TransportFatline();
  } 
  
  keySelect (keyID, fromTransport) {


    console.log("INSTANCE data for key " + keyID + " : "  + JSON.stringify(this.keyData[keyID]))
      selectedKey = keyID;
    const keyData = this.keyData[keyID];
    if (keyData) {
      const octave = 3;
      let theKey;
          // console.log("data for key " + keyID + " : "  + JSON.stringify(keyData))

      if (keyData.keytype == "major") {
        theKey = Tonal.Key.majorKey(keyData.keytonic);
      } else {
        theKey = Tonal.Key.minorKey(keyData.keytonic);
      }

      if (keyData.keytype == "major") {
        console.log("majorkey " + JSON.stringify(theKey));
        var chordIndex = Math.floor(Math.random() * theKey.chords.length);
        let chord = theKey.chords[chordIndex];
        console.log(keyData.keytonic + " " + keyData.keytype + " random chord: " + chord);

        let noteMods = Tonal.Chord.notes(chord, keyData.keytonic + octave);
        const midiNotes = noteMods.map(n => Tonal.Note.midi(n));
        console.log("notes " + noteMods + " midi " + midiNotes);
        if (fromTransport) {
          SynthHit(null,null,null,null,midiNotes);
        }
      } else {
        console.log("minorkey " + JSON.stringify(theKey));
        var chordIndex = Math.floor(Math.random() * theKey.natural.chords.length);
        let chord = theKey.natural.chords[chordIndex];
        console.log(keyData.keytonic + " " + keyData.keytype + " random chord: " + chord);

        let noteMods = Tonal.Chord.notes(chord, keyData.keytonic + octave);
        
        const midiNotes = noteMods.map(n => Tonal.Note.midi(n));
        console.log("notes " + noteMods + " midi " + midiNotes);
        if (fromTransport) {
          SynthHit(null,null,null,null,midiNotes);
        }
        ThreeDeeText(noteMods.toString(), 1, lastRaycastHitObject, lastRaycastHitPosition,null,null,null);
        // this.pSynthOnOff(noteMods);
        // this.polySynth.triggerAttackRelease(noteMods, "2n");
        // this.lastNotes = noteMods;
        // this.mainText.setAttribute("text", { value: "playing "+ noteMods + " \nfrom " + keyTonic + keyType});
      }
      const color = new THREE.Color();
      color.setHex(0xffffff); // Set to red

      // Update color at a specific index (e.g., index 0)
      this.iMesh.setColorAt(keyID, color);

      // Tell Three.js to update the color attribute on the GPU
      this.iMesh.instanceColor.needsUpdate = true;
    }
  }
   
}



export class TransportFatline { 
  constructor(options) {
    // // schema: {
    // init: {default: false},
    // tags: {default: ''},
    // originID: {default: ''},
    // showLine: {default: false},
    // lineWiggle: {default: true}

    // 1. Create the empty object
    const parentObject = new THREE.Object3D();

    // 2. Set its position, rotation, or scale if needed
    parentObject.position.set(0, 1, 0);

    // 3. Add it to the scene
    scene.add(parentObject);
    // init: function Init() {
    // this.tick = AFRAME.utils.throttleTick(this.tick, 100, this);
    // this.taqs = options.tags;
    // this.originID = options.originID;

    const FIXED_DELTA_TIME = 10000 / 60; //1/60th second

    let lastTimestamp = 0;
    let accumulator = 0;
    this.interval = "";
    this.intervalTime = 0;
    this.fraction = 0;
    this.transportIsPlaying = false;
    this.startTime = 0;

    this.loopInterval = null;;

    this.isPlaying = false;
    const positions = [];
        const colors = [];


        this.LoopTransport(false, 60);
        this.isPlaying = true;
    
    const cgeometry = new THREE.SphereGeometry( .25, 16, 8 );
    const cmaterial = new THREE.MeshBasicMaterial( { color: 0x00ff2a, wireframe: false, transparent: true, opacity: .5 } );
    this.objectToCurve = new THREE.Mesh( cgeometry, cmaterial );
    parentObject.add(this.objectToCurve);
        // const points = GeometryUtils.hilbert3D( new THREE.Vector3( 0, 0, 0 ), 20.0, 1, 0, 1, 2, 3, 4, 5, 6, 7 );
    let points = [];
    let n = 100;
    let maxRadius = 8;

    synthTransport = this;
    for (let i = 0; i < n; i++) {

      // Size of each slice is '360 / n' degrees or in radians '2 * Math.PI / n'...
      let angle = i * ( 2 * Math.PI / n );

      // Calculate 'x' distance as 'radius * cos ( angle )' and 'y' distance using 'sin'...
      let x = ( maxRadius ) * Math.cos( angle );

      let y = ( maxRadius ) * Math.sin( angle );

      let point = new THREE.Vector3(x, 1, y);
      points.push(point);


    }

    this.spline = new THREE.CatmullRomCurve3( points );
    const divisions = Math.round( 16 * points.length );
    const point = new THREE.Vector3();
    const color = new THREE.Color();

    for ( let i = 0, l = divisions; i < l; i ++ ) {

        const t = i / l;

        this.spline.getPoint( t, point );

        positions.push( point.x, point.y, point.z );

        color.setHSL( t, 1.0, 0.5, THREE.SRGBColorSpace );
        colors.push( color.r, color.g, color.b );

    }
    // console.log("LINE POSITIONS: "+ JSON.stringify(positions));

    const geometry = new LineGeometry();

    geometry.setPositions( positions );
    geometry.setColors( colors );

    var matLine = new THREE.Line2NodeMaterial( {

        color: 0xffffff,
        linewidth: 10, // in world units with size attenuation, pixels otherwise
        vertexColors: true,

        dashed: false,
        alphaToCoverage: false,

    } );

    var line = new Line2( geometry, matLine );
    line.computeLineDistances();
    line.scale.set( 1,1,1);
    
    parentObject.add( line );
    

    }

    LoopTransport (pause, bpm) {
      
      if (pause) {
        if (this.loopInterval) {
          clearInterval(this.loopInterval);

        }
      }
      if (!this.transportIsPlaying) {
      // const bpm = 120;
        this.transportIsPlaying = true;
        const beatDurationMs = (60 / bpm) * 1000; // Time per beat (500ms at 120 BPM)

        // 4. Start the JavaScript interval loop
        this.loopInterval = setInterval(() => {
          
          // Send an OSC message to scsynth to trigger a new synth node
          // Arguments: Command, SynthDef Name, Node ID (-1 auto-assigns), Target, Add Action, Params...
          // supersonic.send(
          //   '/s_new', 
          //   'sonic-pi-basic_mono_player', 
          //   -1, 
          //   0, 
          //   1, 
          //   'buf', 0
          // );
          console.log(selectedKey + " key with interval beatDurationMs " +beatDurationMs );
          if (selectedKey) {
            if (synthKeys) {  
                synthKeys[0].keySelect(selectedKey, true);
            }
          }
          
          console.log("Boom! Loop triggered.");
        }, beatDurationMs);
      }
    }

    fixedTimeLoop (time) {
       

      // Initialize lastTimestamp on the very first frame
      if (!lastTimestamp) {
        lastTimestamp = currentTimestamp;
      }

      // 2. Calculate how much real time passed since the last frame
      let frameTime = currentTimestamp - lastTimestamp;
      lastTimestamp = currentTimestamp;

      // Panic threshold: Prevent "spiral of death" if the tab loses focus or lags severely
      if (frameTime > 250) {
        frameTime = 250; 
      }

      // 3. Add the elapsed time to our accumulator pool
      accumulator += frameTime;

      // 4. Consume time from the accumulator in fixed chunks
      while (accumulator >= FIXED_DELTA_TIME) {
        updateLine(FIXED_DELTA_TIME); // Your logic runs with a strict, identical step
        accumulator -= FIXED_DELTA_TIME;
      }

    }

    setTimeParameters (interval, intervalTime) {
      this.interval = interval;
      this.intervalTime = intervalTime;
      this.fraction = 0;
      this.transportIsPlaying = true;
    }
    setTransportStatus (isPlaying) {
      if (isPlaying) {
      this.transportIsPlaying = true;
      } else {
      this.transportIsPlaying = false;
      }
    }
    updateLinePosition () {

    // console.log(this.intervalTime + " fraction " + this.fraction);
    this.objectToCurve.position.copy( this.spline.getPoint( this.fraction ) );         
    // this.tangent = this.spline.getTangent( this.fraction );
    // this.axis.crossVectors( this.normal, this.tangent ).normalize( );  
    // this.objectToCurve.quaternion.setFromAxisAngle( this.axis, Math.PI / 2 );
    }

    update (time, deltaTime) {
      if (this.transportIsPlaying) {
        if (this.startTime == 0) {
        this.startTime = time;
        }
        // console.log(time - this.startTime);
        if (this.fraction < 1) {
          this.fraction = (time - this.startTime) / this.intervalTime;
            // this.fraction = this.intervalTime / deltaTime;
          // this.fraction += .01;
          this.updateLinePosition();

        } else {
        this.fraction = 0;
        this.startTime = 0;
        }
      } else {
      //
      }
    }
}