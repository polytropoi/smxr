
import { Application, Assets, Graphics, Texture } from 'pixi';
import { addBackground, addMap } from './addBackground.mjs';
import { addText } from './addText.mjs';
import { addFishes, addSpriteAnimation, animateElements, animateFishes } from './addElements.mjs';
import { addDisplacementEffect } from './addDisplacement.mjs';
import { addGridOverlay, addWaterOverlay, animateWaterOverlay } from './addOverlay.mjs';
import { ReturnMap, ReturnBackground, ReturnSprites } from '../connect/vtt.js';
import { ReturnAudioGroupsData } from '../connect/media.js';
// Create a PixiJS application.
const app = new Application();
// Store an array of fish sprites for animation.
const fishes = [];
let elements = [];
let mappicURL;
let backgroundURL;
let spritesData;
let audioGroupsData;

let sprites


async function setup() {
  // Intialize the application.
  await app.init({ background: '#243a54', resizeTo: window });
  
  // Then adding the application's canvas to the DOM body.
  document.body.appendChild(app.canvas);
}

async function prePreLoader () {
  mappicURL = await ReturnMap();
  backgroundURL = await ReturnBackground();
  console.log("backgroundURL " + backgroundURL);
  spritesData = await ReturnSprites();
  audioGroupsData = await ReturnAudioGroupsData();
  console.log("audioGroupsData " + JSON.stringify(audioGroupsData));
  // console.log("spritesData " + JSON.stringify(spritesData));
}


async function preload() {

  // Create an array of asset data to load.

  const assets = [
    { alias: 'background', src: backgroundURL },
        { alias: 'map', src: mappicURL },
    { alias: 'fish1', src: 'https://pixijs.com/assets/tutorials/fish-pond/fish1.png' },
    { alias: 'fish2', src: 'https://pixijs.com/assets/tutorials/fish-pond/fish2.png' },
    { alias: 'fish3', src: 'https://pixijs.com/assets/tutorials/fish-pond/fish3.png' },
    { alias: 'fish4', src: 'https://pixijs.com/assets/tutorials/fish-pond/fish4.png' },
    { alias: 'fish5', src: 'https://pixijs.com/assets/tutorials/fish-pond/fish5.png' },
    { alias: 'overlay', src: 'https://pixijs.com/assets/tutorials/fish-pond/wave_overlay.png' },
    { alias: 'displacement', src: 'https://pixijs.com/assets/tutorials/fish-pond/displacement_map.png' }
    
    
  ];

  if (spritesData && spritesData.length) {
    assets.push({ alias: 'sprite1', src: spritesData[0].meta.image });
  } 
  // Load the assets defined above.
  await Assets.load(assets);
}

// Asynchronous IIFE

// (async () => {
export async function GoWithIt() { //called from vtt.js
  await setup();
  await prePreLoader();
  await preload();


  if (backgroundURL) {
    addBackground(app);
  }
  if (mappicURL) {
    addMap(app);
    addGridOverlay(app);
  }

  addText(app);
  app.ticker.add((time) => animateElements(app, elements, time));

  addWaterOverlay(app);
  // addDisplacementEffect(app);


  const sprite1 = Texture.from('sprite1');

  addSpriteAnimation(app, sprite1, spritesData[0], elements);
  // Add the animation callbacks to the application's ticker.
  app.ticker.add((time) => {
    // animateFishes(app, fishes, time);
    animateElements(app, elements, time);
    animateWaterOverlay(app, time);
  });


}