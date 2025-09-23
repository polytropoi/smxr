// import '@pixi/layout'; 
import { Application, Assets, Graphics, Texture, Container, RenderLayer, Sprite } from 'pixi';
import { Viewport } from 'pixi-viewport';


// import { LayoutSystem } from '@pixi/layout';
import { addBackground, addMap, addBackgroundVideo, addBackgroundPictures, background } from './addBackground.mjs';
import { addText, addPlayerProfileText, addEventText } from './addText.mjs';
import { addAnimatedSprite, addSprite, animateElements, spriteFilter } from './addElements.mjs';
import { addDisplacementEffect } from './vtt_filters.mjs';
import { addGridOverlay, addWaterOverlay, animateWaterOverlay } from './addOverlay.mjs';
import { ReturnMap, ReturnBackground, ReturnBackgroundVideo, ReturnSprites, ReturnText, ReturnScenePictures, ReturnPictureGroups, ReturnLocations  } from '../connect/vtt.js';
import { LoadPrimaryAudioHowl, ReturnAudioGroupsData, isPlaying } from '../connect/media.js';
import { settings, profile, pixelsPerMeterActual } from '../connect/settings.js';
import { timedEventsListenerMode, PauseIntervals, SetTimedEventsListenerMode, timeKeysData, SetSelectedPosition} from "../../connect/events.js";
// import { keydown, CreateNewLocation } from '../connect/dialogs.js';
import { addButtons, addPlayButton, addSimplePlayButton } from './addButtons.mjs';

import { LoadLocations, AddLocation, locationTokenContainer } from './vtt_locations.mjs';
import { SetTimeKeysData, eventEl } from '../connect/events.js';
import { poiLocations } from '../connect/connect.js';
// import { keydown } from '../connect/dialogs.js';
import { addAudioVizSelect } from './vtt_audioViz.mjs';


export const app = new Application();
export let sceneTags;


export let pixelsPerMeter = 1;

export let viewport;
export let viewportVerticalCenter = 2; //i.e. /2 = center
export let viewportHorizontalCenter = 2; //i.e. /2 = center
export let fontFillColor = 'white';
export let fontFillColorAlt = 'SkyBlue';
export let fontStrokeColor = 'black';
export let font1 = 'Acme';
export let font2 = 'Acme';
export let font3 = 'Acme';

export let hasBgMap = false;
export let hasAudioViz = false;



export function GoToMapLocation (timestamp) {
     console.log("tryna goat mmap locaiton " + timestamp);
      if (locationTokenContainer && locationTokenContainer.children.length) {
        for (let i = 0; i < locationTokenContainer.children.length; i++) {
          if (timestamp == locationTokenContainer.children[i].data.timestamp) {
            console.log(locationTokenContainer.children[i].data.x + " " + locationTokenContainer.children[i].data.z);
          viewport.animate({
                    position: { x: locationTokenContainer.children[i].data.x, y: locationTokenContainer.children[i].data.z }, // Target center position
                    scale: 1.5, // Target zoom level
                    time: 1000, // Animation duration of 1 second
                    ease: 'easeInOutQuad', // Using a common easing function
                    callbackOnComplete: () => {
                        // console.log("Animation completed!");
                    }
                });
                break;
          }
        }
      }
     
}

export let spritesContainer = new Container();
let uicontainer = new Container();
// const spriteLayer = new RenderLayer();
// const uicontainer = new Container( {layout: {
//             width: '80%',
//             height: '80%',
//             justifyContent: 'top',
//             flexDirection: 'row',
//             alignContent: 'center',
//             flexWrap: 'wrap',
//             gap: 4,
//         }});


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
    // viewport.animate({
    //   position: { x: window.innerWidth/2, y: window.innerHeight/2 }, // Target center position
    //   // position: { x: window.innerWidth/viewportHorizontalCenter, y: window.innerHeight/viewportVerticalCenter }, // Target center position
    //   scale: 1.2, // Target zoom level
    //   time: 1000, // Animation duration of 1 second
    //   ease: 'easeInOutQuad' // Using a common easing function
    // });
  }
  localStorage.setItem("viewportPosition", viewport.x + "," + viewport.y + "," + viewport.scale.x);
}

function onZoomedEnd (e) {
  console.log("zoomend! " + viewport.scale.x);

  localStorage.setItem("viewportPosition", viewport.x + "," + viewport.y + "," + viewport.scale.x);
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
  
  viewport = new Viewport({
    screenWidth: window.innerWidth,
    screenHeight: window.innerHeight,
    worldWidth: 10000,
    worldHeight: 10000,
    disableOnContextMenu: true,
    events: app.renderer.events, 
  });
  // textContainer.x = app.stage.width/2;
  if (settings && settings.sceneTags.includes("audioviz")) {
    hasAudioViz = true;
  }

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
  let count = 0;
  let interval = setInterval(() => { //wait a shake for iDB to get localprofile..
    if (profile) {
      playerProfileLoaded(profile)
      clearInterval(interval);
    } else {
      count++;

      console.log("no profile yet...");
      if (count > 3){
        LoadLocations(app, viewport, spritesContainer);
        clearInterval(interval);
      }
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
 
   pixelsPerMeter = pixelsPerMeterActual; //don't wanna reload settings again..?
   
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
  // if (settings.)
  addPlayerProfileText(app, playerProfile, uicontainer);
  // LoadLocations(app, viewport, spritesContainer);
        // setTimeout(() => {
            LoadLocations(app, viewport, spritesContainer); //give it a shake...
        // }, 1000);
  
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


    // if (app.screen.width > app.screen.height) {
    //   // viewport.width = app.screen.width - (app.screen.width * .1);
    //   viewport.scale.y = viewport.scale.x;
    //   } else {
    //   // viewport.height = app.screen.height - (app.screen.height * .1);
    //   viewport.scale.x = viewport.scale.y;
    // }


    const lastP = localStorage.getItem("viewportPosition");
    if (lastP) {
      const pSplit = lastP.split(","); 
      viewport.x = parseFloat(pSplit[0]);
      viewport.y = parseFloat(pSplit[1]);
      viewport.setZoom(parseFloat(pSplit[2]));
    } else {
      viewport.x = app.stage.width/2;
      viewport.y = 0;
      // viewport.y = app.stage.height/2;
      viewport.anchor = .5;
      viewport.setZoom(1.2);
      // viewport.moveToCenter
    }
    // viewport.x = 0;
    // viewport.y = 0;
    // viewport.anchor = .5;
    // viewport.scale = 1;
    // viewport.position = { x: 0, y: 0 }
    app.stage.addChild(viewport);
    // activate plugins
    viewport
        .drag({'mouseButtons': 'middle-right'})
        .pinch()
        .wheel()
        .clampZoom({'minScale': .1, 'maxScale': 10})
        // .bounce({
        // friction: 1,
        // time: 2000,
        // ease: 'easeOutQuad'
        // })
        .decelerate();

    viewport.addEventListener("drag-end", onDragEnd);

    viewport.addEventListener("zoomed-end", onZoomedEnd);
    // viewport.on('pointerdown', (event) => {
    //     // if (keydown == "T") {
    //     //   // viewport.plugins.resume.
    //     //   console.log("pausing vp drag...");
    //     //   viewport.plugins.pause('drag');
    //     // } else {
    //     //   console.log("resuming vp drag");
    //     //   viewport.plugins.resume('drag');
    //     // }
    // });

    // viewport.on('pointerup', (event) => { //main picker for maps
    // // ... handle the event
    //   // const globalPos = event.data.global; // { x: ..., y: ... }
    //   //   // console.log("keydown " + keydown + " for " + sprite.label + " pointerdown at " + sprite.position.x + " " + sprite.position.y);
    //   // const worldPos = viewport.toLocal(globalPos);


    //   // // console.log(viewport.width + " x " + viewport.height + " viewport click on " + viewport.scale.x + " " + viewport.x + " " + viewport.y + " keydown " + keydown + " pointer " + event.x + " " + event.y + " screen " + event.screenX + " " + event.screenY + 
    //   // //   " globalPos " + globalPos.x + " " + globalPos.y + " vs worldPos " + worldPos.x + " " +worldPos.y);

    //   // if (worldPos.x > viewport.width / 2) { //modify coords to match 3D, with zero in the center instead of top left corner
    //   //   worldPos.x = worldPos.x / 2;
    //   // } else {
    //   //   worldPos.x = worldPos.x * -1;
    //   // }
      
    //   // if (worldPos.y > viewport.height / 2) { //modify coords to match 3D, with zero in the center instead of top left corner
    //   //   worldPos.y = worldPos.y / 2;
    //   // } else {
    //   //   worldPos.y = worldPos.y * -1;
    //   // }
    //   // if (keydown != "T") {
    //   //   // viewport.plugins.resume.
    //   //   viewport.plugins.resume("drag");
    //   // }

    //   // SetSelectedPosition('', worldPos.x.toFixed(2) / pixelsPerMeterActual , worldPos.y.toFixed(2) / pixelsPerMeterActual);
    //   // SetSelectedPosition('', worldPos.x.toFixed(2) , worldPos.y.toFixed(2));
    //   // if (keydown == "X") {
    //   //   CreateNewLocation();
    //   //   AddLocation(app, viewport, spritesContainer);
    //   // }

    // });

    


    // viewport.animate({
    //   // position: { x: window.innerWidth/2, y: window.innerHeight/2 }, // Target center position
    //   position: { x: window.innerWidth/2, y: window.innerHeight/2 }, // Target center position
    //   scale: 1, // Target zoom level
    //   time: 1000, // Animation duration of 1 second
    //   ease: 'easeInOutQuad', // Using a common easing function
    //   callbackOnComplete: () => {
    //     console.log("Animation completed!");
       
    //     // Perform actions after animation finishes
    //   }
    // });


    // viewport.bounce();
  } else {
    //no viewport, normal background
  }
  if (backgroundURL) {
    addBackground(app, null, false);
        if (settings && settings.sceneTags && settings.sceneTags.includes("play button")) {
      console.log("tryna add play button");
      addSimplePlayButton(app);
    }
  }
  if (mappicURL) {
    hasBgMap = true;
    addMap(app, viewport, spritesContainer);
        if (settings && settings.sceneTags && settings.sceneTags.includes("play button")) {
      console.log("tryna add play button");
      addSimplePlayButton(app);
    }
  }

  if (settings && settings.sceneTags.includes("background webcam")) {
        addBackgroundVideo(app, viewport, "webcam");
  } else if (backgroundVideoURL) {
      console.log("gotsa backgroundVideoURL "+ backgroundVideoURL);
      addBackgroundVideo(app, viewport, "video");
    if (settings && settings.sceneTags && settings.sceneTags.includes("play button")) {
      console.log("tryna add play button");
      addSimplePlayButton(app);
    }
  }

  if (hasBackgroundPictureGroup) {
    viewport.addChild(spritesContainer);  
    addBackgroundPictures(app, viewport, spritesContainer);
    let elapsed = 0.0;
    // viewport.animate({
    //   // position: { x: window.innerWidth/2, y: window.innerHeight/2 }, // Target center position
    //   position: { x: window.innerWidth/2, y: window.innerHeight/2 }, // Target center position
    //   scale: 1, // Target zoom level
    //   time: 1000, // Animation duration of 1 second
    //   ease: 'easeInOutQuad', // Using a common easing function
    //   callbackOnComplete: () => {
    //     console.log("Animation completed!");
       
    //     // Perform actions after animation finishes
    //   }
    // });

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
    if (settings && settings.sceneTags && settings.sceneTags.includes("play button")) {
      console.log("tryna add play button");
      addSimplePlayButton(app);
    }
  }

  if (locationData) {
    for (let i = 0; i < locationData.length; i++) {
      console.log("location from locationData " + JSON.stringify(locationData[i]));
      if (locationData[i].markerType == "picture") {
        console.log("gotsa sprite picture " + locationData[i].mediaID);
        if (locationData[i].mediaID && locationData[i].mediaID != "" & locationData[i].mediaID != "none") {
          const texture = Texture.from(locationData[i].mediaID.toString());
          const newSprite = new Sprite(texture);
          newSprite.locationData = locationData[i];
          addSprite(app, newSprite, viewport );
          // spriteFilter(newSprite, "HardMixBlend");
        }
      }
      if (locationData[i].markerType == "placeholder" || locationData[i].markerType == "poi") {
        poiLocations.push(locationData[i]);
      
      }
    }
  }

  app.ticker.add((time) => animateElements(app, elements, time));

  // addWaterOverlay(app);
  if (settings && settings.sceneTags.includes("displacement")) {
     if (!background) {
          // background = spritesContainer;
            addDisplacementEffect(app, viewport);
        } else {
          addDisplacementEffect(app, background)
        }

       
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
  app.stage.addChild(uicontainer);
    uicontainer.pivot.x = window.innerWidth / 2;
    uicontainer.pivot.y = window.innerHeight / 2;
  // uicontainer.x = app.screen.width / 2;
  // uicontainer.y = app.screen.height / 2;
  // uicontainer.width = app.screen.width;
  // uicontainer.height = app.screen.height;
  // // const button = new Button();
    // uicontainer.x = app.stage.width / 2;
    // uicontainer.y = app.screen.height * .005;
  //     uicontainer.x = app.screen.width / 2;
  //   uicontainer.y = app.screen.height / 2;

  // app.stage.addChild(uicontainer);

  const buttonData = {};

  addText(app, textData);

// addAudioVizSelect();
  
  // if (viewport) {
  //     viewport.addChild(uicontainer); 
  // } else {

  // }


    

  // window.addEventListener('resize', onResize);
  eventEl.addEventListener('timed-event', onTimedEvent);
}