// import '@pixi/layout'; 
import { Application, Assets, Graphics, Texture, Container } from 'pixi';
import { Viewport } from 'pixi-viewport';
import { Button } from '@pixi/ui';

// import { LayoutSystem } from '@pixi/layout';
import { addBackground, addMap } from './addBackground.mjs';
import { addText } from './addText.mjs';
import { addFishes, addSpriteAnimation, animateElements, animateFishes } from './addElements.mjs';
import { addDisplacementEffect } from './addDisplacement.mjs';
import { addGridOverlay, addWaterOverlay, animateWaterOverlay } from './addOverlay.mjs';
import { ReturnMap, ReturnBackground, ReturnSprites, ReturnText  } from '../connect/vtt.js';
import { ReturnAudioGroupsData } from '../connect/media.js';
// Create a PixiJS application.
const app = new Application();
let viewport;


// Store an array of fish sprites for animation.
const fishes = [];
let elements = [];
export let mappicURL;
let backgroundURL;
let spritesData;
let audioGroupsData;
let textData;

let sprites


function onResize () {

  console.log("tryna resize..." + window.innerWidth + " " + window.innerHeight);
  // app.resizeTo = window;
  // viewport.resizeTo = window;
// Resize the pixi app's renderer
    // app.renderer.resize(
    //     window.innerWidth,
    //     window.innerHeight
    // );
  // app.resize();
  //       viewport.resize();

        let parent = document.getElementById("pixi-container");
        parent.style.width = window.innerWidth;
        parent.style.height = window.innerHeight;
    // Resize the pixi viewport
    // viewport.screenWidth = window.innerWidth;
    // viewport.screenHeight = window.innerHeight;
        // viewport.worldWidth,
        // viewport.worldHeight
 


}

async function setup() {
  // Intialize the application.
  await app.init({ background: '#243a54', resizeTo: window });
  
  // Then adding the application's canvas to the DOM body.
  document.getElementById("pixi-container").appendChild(app.canvas);
}

async function prePreLoader () {
  mappicURL = await ReturnMap();

  if (mappicURL) {

  }
  backgroundURL = await ReturnBackground();
  console.log("backgroundURL " + backgroundURL);
  spritesData = await ReturnSprites();
  audioGroupsData = await ReturnAudioGroupsData();
  console.log("audioGroupsData " + JSON.stringify(audioGroupsData));
  textData = await ReturnText();
  console.log("text " + JSON.stringify(textData));
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



// (async () => {
export async function GoWithIt() { //called from vtt.js
  await setup();
  await prePreLoader();
  await preload();

  if (mappicURL) {

    viewport = new Viewport({
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight,
      worldWidth: 1000,
      worldHeight: 1000,
      events: app.renderer.events, // the interaction module is important for wheel to work properly when renderer.view is placed or scaled
    });
    // add the viewport to the stage

    app.stage.addChild(viewport);
    // activate plugins
    viewport
        .drag()
        .pinch()
        .wheel()
        .decelerate();
    } else {

    }

  //   viewport = new Viewport({
  //       screenWidth: window.innerWidth,
  //       screenHeight: window.innerHeight,
  //       worldWidth: 1000,
  //       worldHeight: 1000,
  //       events: app.renderer.events, // the interaction module is important for wheel to work properly when renderer.view is placed or scaled
  //   });
  //   // add the viewport to the stage

  // app.stage.addChild(viewport);

  // // activate plugins
  // viewport
  //     .drag()
  //     .pinch()
  //     .wheel()
  //     .decelerate();


  if (backgroundURL) {
    addBackground(app);
  }
  if (mappicURL) {
    addMap(app, viewport);
    addGridOverlay(app, viewport);
  }

  app.ticker.add((time) => animateElements(app, elements, time));

  // addWaterOverlay(app);
  // addDisplacementEffect(app);



  if (spritesData && spritesData.length) {
  const sprite1 = Texture.from('sprite1');

    if (mappicURL) {
      addSpriteAnimation(app, sprite1, spritesData[0], elements, viewport);
    } else {
      addSpriteAnimation(app, sprite1, spritesData[0], elements, null);
    }
    // Add the animation callbacks to the application's ticker.
    app.ticker.add((time) => {
      // animateFishes(app, fishes, time);
      animateElements(app, elements, time);
      // animateWaterOverlay(app, time);
    });
  }

 const uicontainer = new Container();
 const button = new Button(
      new Graphics()
          .rect(0, 0, 100, 50, 15)
          .fill(0xFFFFFF)
 );

  uicontainer.addChild(button.view);

  uicontainer.x = app.screen.width / 2;
  uicontainer.y = app.screen.height / 2;
  // uicontainer.width = app.screen.width;
  // uicontainer.height = app.screen.height;
  // // const button = new Button();
  //   // uicontainer.x = app.screen.width / 2;
  //   // uicontainer.y = app.screen.height / 2;
  //     uicontainer.x = app.screen.width / 2;
  //   uicontainer.y = app.screen.height / 2;

  // app.stage.addChild(uicontainer);

  addText(textData, uicontainer);
  
  if (viewport) {
      viewport.addChild(uicontainer); 
  } else {
    app.stage.addChild(uicontainer);
  }

  button.onPress.connect(() => console.log('Button pressed!'));

  window.addEventListener('resize', onResize);
}