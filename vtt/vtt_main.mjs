// import '@pixi/layout'; 
import { Application, Assets, Graphics, Texture, Container, RenderLayer, Sprite } from 'pixi';
import { Viewport } from 'pixi-viewport';


// import { LayoutSystem } from '@pixi/layout';
import { addBackground, addMap, addBackgroundVideo, addBackgroundPictures } from './addBackground.mjs';
import { addText, addPlayerProfileText, addEventText } from './addText.mjs';
import { addAnimatedSprite, addSprite, animateElements, spriteFilter } from './addElements.mjs';
import { addDisplacementEffect } from './addDisplacement.mjs';
import { addGridOverlay, addWaterOverlay, animateWaterOverlay } from './addOverlay.mjs';
import { ReturnMap, ReturnBackground, ReturnBackgroundVideo, ReturnSprites, ReturnText, ReturnScenePictures, ReturnPictureGroups, ReturnLocations  } from '../connect/vtt.js';
import { LoadPrimaryAudioHowl, ReturnAudioGroupsData, isPlaying } from '../connect/media.js';
import { settings, profile } from '../connect/settings.js';
import { timedEventsListenerMode, PauseIntervals, SetTimedEventsListenerMode, timeKeysData} from "../../connect/events.js";
import { addButtons, addFancyButtons } from './addButtons.mjs';
import { SetTimeKeysData, eventEl } from '../connect/events.js';
// import { keydown } from '../main/js/dialogs.js';


export const app = new Application();
export let sceneTags;
export let selectedPosition = {};
let viewport;
export let viewportVerticalCenter = 2; //i.e. /2 = center
export let viewportHorizontalCenter = 2; //i.e. /2 = center
export let fontFillColor = 'white';
export let fontFillColorAlt = 'SkyBlue';
export let fontStrokeColor = 'black';
export let font1 = 'Acme';
export let font2 = 'Acme';
export let font3 = 'Acme';


const spritesContainer = new Container();
const spriteLayer = new RenderLayer();
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
let assetAliases = [];
const fishes = [];
let elements = [];
export let mappicURL;
let backgroundURL;
export let backgroundVideoURL;

let bgvideoTexture;
let spritesData;
let audioGroupsData;
let textData;
let scenePicturesData;
export let pictureGroupsData;
let locationData;
// export let timeKeysData;
export let hasBackgroundPictureGroup = false;
// let profile;

// let sprites
export function SetSelectedPosition(tilename, xpos, ypos) {
   selectedPosition.x = xpos;
   selectedPosition.y = ypos;
   selectedPosition.tilename; 
}

export function SetViewportHorizontalCenter (hcenter) {
  viewportHorizontalCenter = hcenter;
}
export function SetViewportVerticalCenter (vcenter) {
  viewportVerticalCenter = vcenter;
}
function onDragEnd (e) {
  console.log("dragend! screen " + JSON.stringify(e.screen) + " world " + JSON.stringify(e.world) + " center " + viewportVerticalCenter);
  // console.log(viewport.fitWorld(e.world.x, e.world.y));
  // viewport.fitWorld();
  if (hasBackgroundPictureGroup) {
    viewport.animate({
      // position: { x: window.innerWidth/2, y: window.innerHeight/2 }, // Target center position
      position: { x: window.innerWidth/viewportHorizontalCenter, y: window.innerHeight/viewportVerticalCenter }, // Target center position
      scale: 1.1, // Target zoom level
      time: 1000, // Animation duration of 1 second
      ease: 'easeInOutQuad' // Using a common easing function

    });
  }
    
}
function onResize () {

  console.log("tryna resize..." + window.innerWidth + " " + window.innerHeight);
  let parent = document.getElementById("pixi-container");
  parent.style.width = window.innerWidth;
  parent.style.height = window.innerHeight;

}
function onTimedEvent (event) { //events dispatched from events.js, through id=eventsEl
  console.log("gotsa timed-event! " + JSON.stringify(event.details));
  if (event.details.keytype == "Beat") {
    // addEventText(app, "beat", uicontainer);
    addBackgroundPictures(app, viewport, spritesContainer);
    console.log("beat!");
  }
  if (event.details.keytype == "Text Show") {
    addEventText(app, event.details, uicontainer);
  }
}

async function setup() {
  // Intialize the application.
  console.log("background color " + settings.sceneColor1);
  await app.init({ background: 'black', resizeTo: window, antialias: true}); //color reset from settings below
  
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
  // if (mappicURL) {

  // }
  backgroundURL = await ReturnBackground();
  console.log("backgroundURL " + backgroundURL);
  backgroundVideoURL = await ReturnBackgroundVideo();
  // console.log("backgroundVideoURL " + settings.backgroundVideoURL);
  spritesData = await ReturnSprites();
  audioGroupsData = await ReturnAudioGroupsData();
  console.log("audioGroupsData " + JSON.stringify(audioGroupsData));
  textData = await ReturnText();
  console.log("text " + JSON.stringify(textData));

  scenePicturesData = await ReturnScenePictures();
  // console.log("scenePicturesData " + scenePicturesData);
  // pictureGroupsData = await ReturnPictureGroups();
  console.log("pictureGroups " + pictureGroupsData);
  locationData = await ReturnLocations();
  
  console.log("sceneColor1 " + settings.sceneColor1);
  let interval = setInterval(() => { //wait a shake for iDB to get localprofile..
    if (profile) {
      playerProfileLoaded(profile)
      clearInterval(interval);
    } else {
      console.log("no profile yet...");
    }
  }, 1000); 

  let picGroupMgr = document.getElementById("pictureGroupsData"); //hrm, should do this here for all the ones in vtt.js
  if (picGroupMgr) {
    let theData = picGroupMgr.getAttribute('data-picture-groups');
    pictureGroupsData = JSON.parse(atob(theData)); //convert from base64
    // console.log("pictureGroups data :" +JSON.stringify(pictureGroupsData));  
    console.log("pictureGroups " + JSON.stringify(pictureGroupsData));
  }
     // console.log("Settings : " + JSON.stringify(settings));
   let timedEventsEl = document.getElementById('timedEventsDataElement'); //volume, color, etc...
   if (timedEventsEl) {
      let theTimedEventsData = timedEventsEl.getAttribute('data-timedevents');
      const tkData =  JSON.parse(atob(theTimedEventsData));

      if (tkData.listenTo) {
        SetTimedEventsListenerMode(tkData.listenTo);
      }
      // timedEventsListenerMode = ;
      // window.timedEventsListenerMode = timedEventsListenerMode;
      console.log("timekeys Data1: " + JSON.stringify(timeKeysData));
   } else if (settings && settings.sceneTimedEvents) {
      console.log("timedEventsListenerMode " + settings.sceneTimedEvents.listenTo);
      SetTimedEventsListenerMode(settings.sceneTimedEvents.listenTo);
   }
   if (settings && settings.primary_mp3url) {
      LoadPrimaryAudioHowl();
   }

   if (settings && settings.sceneTags) {
    sceneTags = settings.sceneTags;
   }
 

    // Assets.addBundle('fonts', [{ alias: 'Acme', src: '../../fonts/web/Acme.woff' }]);

    if (settings && settings.sceneFontFillColor) {
      fontFillColor = settings.sceneFontFillColor;
    }
    if (settings && settings.sceneTextBackgroundColor) {
      // fontFillColorAlt = settings.sceneTextBackgroundColor;
    }
    if (settings && settings.sceneFontWeb1) {
      let fonts = [];
      fonts.push({ alias: 'Acme', src: '../../fonts/web/Acme.woff' });
      font1 = settings.sceneFontWeb1;
      console.log("FONT 1 IS "+ font1);
      const font1path = "../../fonts/web/" + font1.toString();
      fonts.push({ alias: stripExtension(font1), src: font1path  });
      
      Assets.addBundle('fonts', fonts); 
   
    }
}

export function stripExtension(filename) {
  const lastDotIndex = filename.lastIndexOf('.');
  if (lastDotIndex === -1) { // No extension found
    return filename;
  }
  return filename.substring(0, lastDotIndex);
}



async function preload() {

 await Assets.init({
    preferences: {
        crossOrigin: 'anonymous'
    }
  });

  const assets = [
    { alias: 'background', src: backgroundURL, crossOrigin: 'anonymous' },
    { alias: 'backgroundVideo', src: backgroundVideoURL, crossOrigin: 'anonymous' },
    { alias: 'map', src: mappicURL, crossOrigin: 'anonymous' },
    { alias: 'overlay', src: '/vtt/files/wave_overlay.png' },
    { alias: 'displacement', src: '/vtt/files/displacement_map.png' }
  ];

  if (spritesData && spritesData.length) { //must flex to +++
    assets.push({ alias: 'sprite1', src: spritesData[0].meta.image, crossOrigin: 'anonymous' });
  } 


  if (scenePicturesData && scenePicturesData.length) {
    for (let i = 0; i < scenePicturesData.length; i++) {
      // if (scenePicturesData[i].tags && scenePicturesData[i].tags.includes("logo")) {
      console.log("add scenepicture to assets " + scenePicturesData[i]._id + " " + scenePicturesData[i].url);
        assets.push({ alias: scenePicturesData[i]._id, src: scenePicturesData[i].url, crossOrigin: 'anonymous'});
      // } 
    }
  }
  if (pictureGroupsData && pictureGroupsData[0].images.length) {
    if (pictureGroupsData[0].tags.includes("background") ) {
      hasBackgroundPictureGroup = true;


    for (let i = 0; i < pictureGroupsData[0].images.length; i++) {
      
      // if (scenePicturesData[i].tags && scenePicturesData[i].tags.includes("logo")) {
      // console.log("add grouppicture to assets " + pictureGroupsData[0].images[i]._id + " " + pictureGroupsData[0].images[i].url);
        assets.push({ alias: pictureGroupsData[0].images[i]._id, src: pictureGroupsData[0].images[i].url, crossOrigin: 'anonymous'});
      } 
    }
  }
  // Load the assets defined above.

  await Assets.load(assets);
await Assets.loadBundle('fonts');

}


export function playerProfileLoaded (playerProfile) {
  addPlayerProfileText(app, playerProfile, uicontainer);
}

export async function GoWithIt() { //called from vtt.js
  await setup();
  await prePreLoader();
  await preload();
  console.log("sceneColor1 " + settings.sceneColor1 );
  if (!hasBackgroundPictureGroup) { //keep bg black for this
    app.renderer.background.color = settings.sceneColor1; 
  }
  if (mappicURL || backgroundVideoURL || hasBackgroundPictureGroup) { // just use a tag

    viewport = new Viewport({
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight,
      worldWidth: 1000,
      worldHeight: 1000,
      disableOnContextMenu: true,
      events: app.renderer.events, 
    });
    if (app.screen.width > app.screen.height) {
      viewport.width = app.screen.width - (app.screen.width * .1);
      viewport.scale.y = viewport.scale.x;
      } else {
      viewport.height = app.screen.height - (app.screen.height * .1);
      viewport.scale.x = viewport.scale.y;
    }


    viewport.x = 0;
    viewport.y = 0;
    viewport.scale = 1.5
    viewport.position = { x: 0, y: 0 }
    app.stage.addChild(viewport);
    // activate plugins
    viewport
        .drag()
        .pinch()
        .wheel()
        .decelerate();

    viewport.addEventListener("drag-end", onDragEnd);
    // viewport.bounce();
  } else {
    //no viewport, normal background
  }
  if (backgroundURL) {
    addBackground(app, null, false);
  }
  if (mappicURL) {
    addMap(app, viewport, spritesContainer);
  }
  if (backgroundVideoURL) {
    console.log("gotsa backgroundVideoURL "+ backgroundVideoURL);
    addBackgroundVideo(app, viewport, spritesContainer);
  }

  if (hasBackgroundPictureGroup) {
    addBackgroundPictures(app, viewport, spritesContainer);
    let elapsed = 0.0;

    // app.ticker.add((ticker) => {
    //     // Run every frame, delta is the time since last update
    //     sprite.rotation += 0.1 * ticker.deltaTime;
    // });
    app.ticker.add((ticker) => {
      if (isPlaying) {
        // Add the time to our total elapsed time
        elapsed += ticker.deltaTime;
        // console.log(elapsed);
        if (elapsed > 300) {
          elapsed = 0;
          addBackgroundPictures(app, viewport, spritesContainer);

        }
      }
    });
  }

  if (locationData) {
    for (let i = 0; i < locationData.length; i++) {
      console.log("location " + JSON.stringify(locationData[i]));
      if (locationData[i].markerType == "picture") {
        if (locationData[i].mediaID && locationData[i].mediaID != "" & locationData[i].mediaID != "none") {
          const texture = Texture.from(locationData[i].mediaID);
          const newSprite = new Sprite(texture);
          newSprite.locationData = locationData[i];
          addSprite(app, newSprite, viewport );
          // spriteFilter(newSprite, "HardMixBlend");
        }
      }
    }
  }

  app.ticker.add((time) => animateElements(app, elements, time));

  // addWaterOverlay(app);
  if (settings && settings.sceneTags.includes("displacement")) {
        addDisplacementEffect(app);
  }




  if (spritesData && spritesData.length) {
  const sprite1 = Texture.from('sprite1');

  // const logoSprite
    if (mappicURL) {
      addAnimatedSprite(app, sprite1, spritesData[0], 15, elements, viewport, spritesContainer);
    } else {
      addAnimatedSprite(app, sprite1, spritesData[0], 15, elements, null, spritesContainer);
    }
    // Add the animation callbacks to the application's ticker.


    // app.ticker.add((time) => {
    //   // animateFishes(app, fishes, time);
    //   // animateElements(app, elements, time);
    //   // animateWaterOverlay(app, time);
    // });
  
  }


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

  const buttonData = {};
  addText(app, textData, uicontainer);
  if (settings && settings.sceneTags && settings.sceneTags.includes("play button")) {
    addFancyButtons(app, buttonData, uicontainer);
  }

  
  // if (viewport) {
  //     viewport.addChild(uicontainer); 
  // } else {
  app.stage.addChild(uicontainer);
  // }



  // window.addEventListener('resize', onResize);
  eventEl.addEventListener('timed-event', onTimedEvent);
}