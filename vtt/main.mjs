import { Application, Assets, Graphics } from 'pixi';
import { addBackground } from './addBackground.mjs';
import { addFishes, animateFishes } from './addElements.mjs';
import { addDisplacementEffect } from './addDisplacement.mjs';
import { addGridOverlay, addWaterOverlay, animateWaterOverlay } from './addOverlay.mjs';
import { ReturnBackgroundMap } from '../connect/landing.js';
// Create a PixiJS application.
const app = new Application();
// Store an array of fish sprites for animation.
const fishes = [];
let mappicURL = "";


async function setup() {
  // Intialize the application.
  await app.init({ background: '#243a54', resizeTo: window });
  
  // Then adding the application's canvas to the DOM body.
  document.body.appendChild(app.canvas);
}
async function prePreLoader () {
  mappicURL = await ReturnBackgroundMap();
  console.log("mappicURL " + mappicURL);
}


async function preload() {

  // Create an array of asset data to load.
  const assets = [
    { alias: 'background', src: mappicURL },
    { alias: 'fish1', src: 'https://pixijs.com/assets/tutorials/fish-pond/fish1.png' },
    { alias: 'fish2', src: 'https://pixijs.com/assets/tutorials/fish-pond/fish2.png' },
    { alias: 'fish3', src: 'https://pixijs.com/assets/tutorials/fish-pond/fish3.png' },
    { alias: 'fish4', src: 'https://pixijs.com/assets/tutorials/fish-pond/fish4.png' },
    { alias: 'fish5', src: 'https://pixijs.com/assets/tutorials/fish-pond/fish5.png' },
    { alias: 'overlay', src: 'https://pixijs.com/assets/tutorials/fish-pond/wave_overlay.png' },
    { alias: 'displacement', src: 'https://pixijs.com/assets/tutorials/fish-pond/displacement_map.png' },
  ];

  // Load the assets defined above.
  await Assets.load(assets);
}

// Asynchronous IIFE

// (async () => {
export async function GoWithIt() { //called from landing.js
  await setup();
  await prePreLoader();
  await preload();

  addBackground(app);
    addFishes(app, fishes);

  // Add the fish animation callback to the application's ticker.
  app.ticker.add((time) => animateFishes(app, fishes, time));

  addWaterOverlay(app);
  // addDisplacementEffect(app);
  addGridOverlay(app);

  // Add the animation callbacks to the application's ticker.
  app.ticker.add((time) => {
    animateFishes(app, fishes, time);
    animateWaterOverlay(app, time);
  });

  //

// Even if we scale the Graphics object, the line remains 1 pixel wide
// graphics.scale.set(2);
// })()
}