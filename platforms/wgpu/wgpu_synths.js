

import { SuperSonic } from "https://unpkg.com/supersonic-scsynth@0.81.0/dist/supersonic.js";
import * as THREE from 'three/webgpu';


import { scene } from './wgpu_main.mjs';
import { activeObjex } from './wgpu_locations.js';

export let superSonicLoaded = false;
let supersonic;
// let synthDef1 = 'sonic-pi-prophet';
let synthDef1 = 'sonic-pi-mod_pulse';

let synthDef2 = 'sonic-pi-prophet';
let synthDefs = ['sonic-pi-mod_pulse','sonic-pi-prophet','sonic-pi-blade','sonic-pi-fm','sonic-pi-bass_foundation','sonic-pi-organ_tonewheel','sonic-pi-gabberkick','sonic-pi-rhodey' ]
let synth1;

let nodeCount = 0;
let nodeID;

let sonic = null;
let isPlaying = false;
let timerId = null;

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
export async function SynthHit(position, volFactor, distance) {

    // await supersonic.loadSynthDef(synthDef1);

    if (supersonic && superSonicLoaded) {

       
        const tree = supersonic.getTree();
        const nodeCount = tree.nodeCount;
        console.log(nodeCount);
      if (nodeCount < 10) {
          //   console.log('Count:', metrics.scsynthProcessCount);


          // const notes = [32, 34, 38, 42, 44, 48, 52, 60];

          // const noteIndex = Math.floor(Math.random() * notes.length);
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
      }
        // console.log("Processed:" + metrics.scsynthMessagesProcessed);
      // }
    }
}


function applyPitchBend(targetFreq) {
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

export function CreateSynthKeys() {

  let tonics = ["A","A#","Ab","B","B#","Bb","C","C#","D","D#","Db","E","E#","Eb","F","F#","Fb","G","G#","Gb"];
  let types = ["major", "minor", "minor7"];

  const count = types.length * tonics.length;
  const geo = new THREE.BoxGeometry(.5,.5,1,1);
  const mat = new THREE.MeshBasicMaterial();
  // const mesh = new THREE.Mesh(geo, mat);
  const instancedMesh = new THREE.InstancedMesh(geo, mat, count);
  scene.add(instancedMesh);
  instancedMesh.userData = {};
  instancedMesh.userData.locationData = {};
    instancedMesh.userData.locationData.name = "synthKeys";
  activeObjex.push(instancedMesh);
  
// 4. Set initial transformation matrix for each instance
  const dummy = new THREE.Object3D();
  let k = 0;
  
  for (let i = 0; i < tonics.length; i++) {
    
    for (let n = 0; n < types.length; n++) {

    dummy.position.set(i + 1, n, -5);
    // const clone = mesh.clone();
    dummy.updateMatrix();
    
    // Apply matrix to the instanced mesh index
    instancedMesh.setMatrixAt(k, dummy.matrix);

    k++;

          // clone.userData.keytonic = tonics[i];
          // clone.userData.keytype = types[n];

    // clone.position.set(i, n, 5);

  // for (let i = 0; i < numChildren; i++) {
    // Calculate the angle for this child
    // const angle = (i / numChildren) * Math.PI * 2;

    // // Compute X and Z coordinates using trigonometry
    // const x = Math.cos(angle) * radius;
    // const z = Math.sin(angle) * radius;

    // // Create a simple mesh (e.g., a small cube)
    // const geometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
    // const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    // const childMesh = new THREE.Mesh(geometry, material);

    // // Set position relative to the group's center
    // childMesh.position.set(x, 0, z);

    // // Optional: Rotate the child to face outward from the center
    // childMesh.rotation.y = -angle;

    // // Add the child to the parent group
    // parentGroup.add(childMesh);

  // }
    }


  }
    instancedMesh.instanceMatrix.needsUpdate = true;
}