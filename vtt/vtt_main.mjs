// import '@pixi/layout'; 
import { Application, Assets, Graphics, Texture, Container } from 'pixi';
import { Viewport } from 'pixi-viewport';
import { Button, ButtonContainer } from '@pixi/ui';

// import { LayoutSystem } from '@pixi/layout';
import { addBackground, addMap } from './addBackground.mjs';
import { addText, addPlayerProfileText } from './addText.mjs';
import { addFishes, addSpriteAnimation, animateElements, animateFishes } from './addElements.mjs';
import { addDisplacementEffect } from './addDisplacement.mjs';
import { addGridOverlay, addWaterOverlay, animateWaterOverlay } from './addOverlay.mjs';
import { ReturnMap, ReturnBackground, ReturnSprites, ReturnText, ReturnProfile  } from '../connect/vtt.js';
import { ReturnAudioGroupsData } from '../connect/media.js';
import { settings, profile } from '../connect/settings.js';

// Create a PixiJS application.
const app = new Application();
let viewport;

const uicontainer = new Container( {layout: {
            width: '80%',
            height: '80%',
            justifyContent: 'top',
            flexDirection: 'row',
            alignContent: 'center',
            flexWrap: 'wrap',
            gap: 4,
        }});


// Store an array of fish sprites for animation.
const fishes = [];
let elements = [];
export let mappicURL;
let backgroundURL;
let spritesData;
let audioGroupsData;
let textData;
// let profile;

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
  
  app.stage.layout = {
        width: 'auto',
        height: 'auto',
        justifyContent: 'center',
        alignItems: 'center',
    };
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

  let interval = setInterval(() => { //wait a shake for iDB to get localprofile..
    if (profile) {
      playerProfileLoaded(profile)
      clearInterval(interval);
    } else {
      console.log("no profile yet...");
    }
  }, 1000); 
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


export function playerProfileLoaded (playerProfile) {
  addPlayerProfileText(app, playerProfile, uicontainer);
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
    if (app.screen.width > app.screen.height) {
      viewport.width = app.screen.width - (app.screen.width * .1);
          // background.width = app.screen.width;
      viewport.scale.y = viewport.scale.x;
    } else {
      /**
       * If the preview is square or portrait, then fill the height of the screen instead
       * and apply the scaling to the horizontal scale accordingly.
       */
      viewport.height = app.screen.height - (app.screen.height * .1);
      viewport.scale.x = viewport.scale.y;
    }
    // viewport.x = app.screen.width * .01;
    // viewport.y = app.screen.height * .01;

    viewport.x = 0;
    viewport.y = 0;
    // 

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

//  const button = new Button(
//       new Graphics()
//           .rect(0, 0, 100, 50, 15)
//           .fill(0xFFFFFF)
//  );

//   const button = new FancyButton({
//      new Graphics()
//           .fill(0xFFFFFF)
//           .roundRect(0, 0, 100, 50, 15),
//      text: 'Click me!',
//      animations: {
//           hover: {
//               props: {
//                   scale: {
//                       x: 1.1,
//                       y: 1.1,
//                   }
//               },
//               duration: 100,
//           },
//           pressed: {
//               props: {
//                   scale: {
//                       x: 0.9,
//                       y: 0.9,
//                   }
//               },
//               duration: 100,
//           }
//       }
//  });
// //  button.x 
//  button.x = app.screen.width / 2;
//   button.y = app.screen.height * .2;
            // const buttonView = new Container();
            // const buttonBg = new Graphics().roundRect(0, 0, 200, 300, 300).fill(.3 * 0xffffff);
            // // const text = new Text({ text: '🤙', style: { fontSize: 70 } });
            //   const text = new Text({ text: 'whoa', style: { fontSize: 70 } });

            // text.anchor = 0.5;
            // text.x = buttonBg.width / 2;
            // text.y = buttonBg.height / 2;

            // buttonView.addChild(buttonBg, text);

            // // Component usage !!!
            // const button = new Button(buttonView);

            // button.enabled = !disabled;

            // button.onPress.connect(() => action('onPress'));
            // button.onDown.connect(() => action('onDown'));
            // button.onUp.connect(() => action('onUp'));
            // button.onHover.connect(() => action('onHover'));
            // button.onOut.connect(() => action('onOut'));
            // button.onUpOut.connect(() => action('onUpOut'));
      const button = new Button(
        new Graphics()
          .fill(0xFFFFFF)
          .roundRect(0, 0, 100, 50, 15)
      );
//  button.x = app.screen.width / 2;
//   button.y = app.screen.height / 2;
  uicontainer.addChild(button.view);

  // uicontainer.x = app.screen.width / 2;
  // uicontainer.y = app.screen.height / 2;
  // uicontainer.width = app.screen.width;
  // uicontainer.height = app.screen.height;
  // // const button = new Button();
    uicontainer.x = app.screen.width / 2;
    // uicontainer.y = app.screen.height * .005;
  //     uicontainer.x = app.screen.width / 2;
  //   uicontainer.y = app.screen.height / 2;

  // app.stage.addChild(uicontainer);

  addText(app, textData, uicontainer);
  
  // if (viewport) {
  //     viewport.addChild(uicontainer); 
  // } else {
    app.stage.addChild(uicontainer);
  // }

  button.onPress.connect(() => console.log('Button pressed!'));

  // window.addEventListener('resize', onResize);
}