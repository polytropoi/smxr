import { Sprite, Container, Assets, Spritesheet, TilingSprite, Texture, ColorMatrixFilter } from 'pixi';
// import 'pixi.js/advanced-blend-modes';
// import '../main/js/pixi/pixi.min.mjs/advanced-blend-modes'
// import { CompositeTilemap } from 'pixi-tilemap';
import { SetSelectedPosition } from '../connect/events.js';
import { keydown, CreateNewLocation } from '../connect/dialogs.js';
import { viewport, sceneTags, mappicURL, backgroundVideoURL, pictureGroupsData, 
  viewportHorizontalCenter, viewportVerticalCenter, SetViewportVerticalCenter, SetViewportHorizontalCenter, spritesContainer,
  videoGroupsData} from './vtt_main.mjs';
import { addGridOverlay } from './addOverlay.mjs';

import { AddLocation } from './vtt_locations.mjs';
import {applyFilters} from './vtt_filters.mjs';
export let mapsize = {};

export let background;
export let backgroundPictureGroupSprite = new Sprite();

// import { settings } from '../connect/settings.js';

export function addBackground(app, viewport, isTileable) {


    if (isTileable) {
      // const texture = Assets.load('background');
        background = new TilingSprite({
        texture: Texture.from('background'),
        width: app.screen.width,
        height: app.screen.height,
      });
    } else {
      background = Sprite.from('background');
    

      // Center background sprite anchor.
      background.anchor.set(0.5);
      if (app.screen.width > app.screen.height) {
        background.width = app.screen.width * 1.05;
        background.scale.y = background.scale.x;
      } else {
        /**
         * If the preview is square or portrait, then fill the height of the screen instead
         * and apply the scaling to the horizontal scale accordingly.
         */
        background.height = app.screen.height * 1.05;
        background.scale.x = background.scale.y;
      }
        // Position the background sprite in the center of the stage.
        background.x = app.screen.width / 2;
        background.y = app.screen.height / 2;
        // Add the background to the stage.
        // app.stage.addChild(background);
    }
    if (viewport) {

      viewport.addChild(background);
          viewport.zoomPercent(.75, true);    
    } else {
      app.stage.addChild(background);
    }
           let count = 0;
    if (isTileable) {

      app.ticker.add(() => {
          count += 0.0005;

          background.tileScale.x = 1.5 + Math.sin(count);
          background.tileScale.y = 1.5 + Math.cos(count);

          background.tilePosition.x += .1;
          background.tilePosition.y += .2;
          if (count > 1) {
            count = 0;
          }
        });
    }
       
}


export async function addBackgroundVideo(app, viewport, source) {


  let video = document.createElement("video");

  if (source == "webcam") {
    addWebcam(app);
  } else if (source == "mapcam") {
  let constraints = { video: true, audio: false };
    const selectedVideoInput = localStorage.getItem("cameraInputDevice"); 
    console.log("tryna use selectedVideoInput " + selectedVideoInput);
    if (selectedVideoInput) {
      constraints = { 
        video: { deviceId: selectedVideoInput, width: 4096, height: 2160 } // Replace with actual deviceId
        // audio: { deviceId: '' } // Replace with actual deviceId
      };
    } 

    // Get a MediaStream from the webcam
    // const stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: true });
    const stream = await navigator.mediaDevices.getUserMedia(constraints);

    // Create an HTML video element to use the stream
    // Get the settings of the video track
    const videoTrack = stream.getVideoTracks()[0];
    const settings = videoTrack.getSettings();

    const actualWidth = settings.width;
    const actualHeight = settings.height;

    console.log('Actual camera width:', actualWidth);
    console.log('Actual camera height:', actualHeight);

    video.autoplay = true;
    video.srcObject = stream;
    // Setting srcObject is required for a live stream

    console.log("webcam VIDEO WIDTH " + actualWidth + " HEIGHT " +actualHeight);
    // Create a texture from the video element
    const videoTexture = await Texture.from(video);

    addBackgroundCamera(app, viewport, actualWidth, actualHeight, videoTexture, spritesContainer);
      
  } else {
      video = document.getElementById("bgVideo");
      addMap = true;
          console.log("adding video with source " + source);
    const width = video.videoWidth;
    const height = video.videoHeight;
    console.log("VIDEO WIDTH " + video.videoWidth + " HEIGHT " + video.videoHeight);
    const texture = Texture.from(video);
    const backgroundVideo = new Sprite(texture);    
    backgroundVideo.anchor.set(0.5);
    // spritesContainer.anchor.set(0.5);
    if (app.screen.width > app.screen.height) {
      backgroundVideo.width = app.screen.width * 1.05;
      backgroundVideo.scale.y = backgroundVideo.scale.x;
    } else {
      /**
       * If the preview is square or portrait, then fill the height of the screen instead
       * and apply the scaling to the horizontal scale accordingly.
       */
      backgroundVideo.height = app.screen.height * 1.05;
      backgroundVideo.scale.x = backgroundVideo.scale.y;
    }
    // Position the backgroundVideo sprite in the center of the stage.
    backgroundVideo.x = app.screen.width / 2;
    backgroundVideo.y = app.screen.height / 2;
    addOverlayMap(app, viewport, width, height, texture, spritesContainer);
  }


  

}

async function addWebcam (app) {
   
  let constraints = { video: true };
    const selectedVideoInput = localStorage.getItem("cameraInputDevice"); 
    console.log("tryna use selectedVideoInput " + selectedVideoInput);
    if (selectedVideoInput) {
      constraints = { 
        video: { deviceId: selectedVideoInput, width: 4096, height: 2160 } // Replace with actual deviceId
        // audio: { deviceId: '' } // Replace with actual deviceId
      };
    } 

    const stream = await navigator.mediaDevices.getUserMedia(constraints);


    const videoTrack = stream.getVideoTracks()[0];
        // videoTrack.applyConstraints(constraints);
    const settings = videoTrack.getSettings();

    const actualWidth = settings.width;
    const actualHeight = settings.height;
        console.log("tryna webcam " + actualWidth + " x " + actualHeight);
    const videoElement = document.createElement('video');
    // videoElement.height = actualWidth;
    // videoElement.width = actualWidth;
    videoElement.srcObject = stream;
    videoElement.autoplay = true; 
    videoElement.muted = true;
    await videoElement.play();

    // videoElement.addEventListener('pause', async () => {
    //     console.info('pause event')
    //     try {
    //         await videoElement.play();
    //     } catch (e) {
    //         console.error('Play failed after video pause', e);
    //     }
    // });

    const videoTexture = Texture.from(videoElement);

    const videoSprite = new Sprite({
        texture: videoTexture,
        label: "video"
    });

    videoSprite.anchor.set(0.5);
    videoSprite.x = app.renderer.width / 2;
    videoSprite.y = app.renderer.height / 2;
    videoSprite.height = app.renderer.height;
    videoSprite.width = app.renderer.width;
      if (app.screen.width > app.screen.height) {
        spritesContainer.width = app.screen.width - (app.screen.width * .01);
            // background.width = app.screen.width;
        spritesContainer.scale.y = spritesContainer.scale.x;
      } else {
        /**
         * If the preview is square or portrait, then fill the height of the screen instead
         * and apply the scaling to the horizontal scale accordingly.
         */
        spritesContainer.height = app.screen.height - (app.screen.height * .01);
        spritesContainer.scale.x = spritesContainer.scale.y;
      }
    spritesContainer.addChild(videoSprite);
    viewport.addChild(spritesContainer);
    
    viewport.animate({
        // position: { x: 0, y: 0 }, // Target center position
      position: { x: app.screen.width/2, y: app.screen.height/2 }, // Target center position
      // position: { x: window.innerWidth/2, y: window.innerHeight/2 }, // Target center position
      scale: 1.1, // Target zoom level
      time: 1000, // Animation duration of 1 second
      ease: 'easeInOutQuad' // Using a common easing function
  
    });
    applyFilters(app, spritesContainer);
    // app.stage.addChild(videoSprite );
}


async function addBackgroundCamera(app, viewport, width, height, videoTexture, spritesContainer) {

    const map = videoTexture;
   
    let mapSpritesData = {};
    mapSpritesData.meta = {};
    mapSpritesData.frames = {};

    const picwidth = width;
    const picheight = height;
    mapsize.x = picwidth;
    mapsize.y = picheight;

    let tilesize = 32;
    const xCount = picwidth / tilesize;
    const yCount = picheight / tilesize;

        viewport.worldWidth = picwidth;                        
        viewport.worldHeight = picheight;   

    console.log("tryna addBackground camera w map xCount : " + xCount + " yCount : " + yCount);
  
    //cook the spritesheet json based on image rez and tilesize
    for (let i = 0; i < xCount; i++) {
      const xpos = (i * tilesize);
      for (let k = 0; k < yCount; k++) {
        const tileID = "tile_" + i + "_" + k;
        const ypos = (k * tilesize);
        //add object the spritesheet json!
        mapSpritesData.frames[tileID] = {frame: { x: xpos, y: ypos, w: tilesize, h: tilesize },
                                        sourceSize: { w: tilesize, h: tilesize },
                                        trimmed: false,
                                        spriteSourceSize: { x: 0, y: 0, w: tilesize, h: tilesize },
                                        anchor: { x: 0, y: 0 }};
      }
    }

    mapSpritesData.meta.images = mappicURL;
    console.log("mapSpritesData " + JSON.stringify(mapSpritesData));
    
    // const sheetTexture = await Assets.load(mappicURL);
    
    const spritesheet = new Spritesheet(map, mapSpritesData);
    await spritesheet.parse();
   
    for(var key in mapSpritesData.frames) {

        if(mapSpritesData.frames.hasOwnProperty(key)) {
          // spritesContainer.
          // console.log("mapsprite " + key);
          const sprite = new Sprite(spritesheet.textures[key]);
          // const sprite = new Sprite();
          const keySplit = key.split("_");

          sprite.x = parseInt((keySplit[1]) * tilesize);
          sprite.y = parseInt((keySplit[2]) * tilesize);
          sprite.position.set(parseInt(keySplit[1]) * tilesize, parseInt((keySplit[2]) * tilesize))
          sprite.width = tilesize;
          sprite.height = tilesize;
          sprite.anchor.set(0);
          sprite.interactive = true;
          sprite.buttonMode = true;
          sprite.label = key;
          // sprite.alpha = .1;
          // sprite.on('pointerenter', () => {
          //    if (keydown =="X") {
          //     sprite.tint = .7 * 0xffffff;
          //   } else {
          //     sprite.tint = .3 * 0xffffff;
          //   }
          //   // console.log(sprite.label +  " tile entered at " + sprite.position.x + " " + sprite.position.y);
          // });
          // sprite.on('pointerleave', () => {
          //   sprite.tint = 0xffffff;
          //   // console.log("Sprite exit at " + sprite.position.x + " " + sprite.position.y);
          // });
          sprite.on('pointerdown', (event) => {
            // sprite.tint = 0xffffff;
          const globalPos = event.data.global; // { x: ..., y: ... }
            // console.log("keydown " + keydown + " for " + sprite.label + " pointerdown at " + sprite.position.x + " " + sprite.position.y);
          const worldPos = viewport.toLocal(globalPos);
              console.log("keydown " + keydown + " for " + sprite.label + " pointerdown globalPos " + globalPos.x + " " + globalPos.y + " vs worldPos " + worldPos.x + " " +worldPos.y);

          });

          spritesContainer.addChild(sprite);
          }
        }
        // Center background sprite anchor.
        // viewport.anchor = .5;
        // viewport.width = width;
        // viewport.height = height;

      /**
       * If the preview is landscape, fill the width of the screen
       * and apply horizontal scale to the vertical scale for a uniform fit.
       */

      if (app.screen.width > app.screen.height) {
        spritesContainer.width = app.screen.width - (app.screen.width * .01);
            // background.width = app.screen.width;
        spritesContainer.scale.y = spritesContainer.scale.x;
      } else {
        /**
         * If the preview is square or portrait, then fill the height of the screen instead
         * and apply the scaling to the horizontal scale accordingly.
         */
        spritesContainer.height = app.screen.height - (app.screen.height * .01);
        spritesContainer.scale.x = spritesContainer.scale.y;
      }

      viewport.addChild(spritesContainer);
    
      viewport.animate({
          // position: { x: 0, y: 0 }, // Target center position
        position: { x: app.screen.width/2, y: app.screen.height/2 }, // Target center position
        // position: { x: window.innerWidth/2, y: window.innerHeight/2 }, // Target center position
        scale: 1.1, // Target zoom level
        time: 1000, // Animation duration of 1 second
        ease: 'easeInOutQuad' // Using a common easing function
    
      });
      applyFilters(app, spritesContainer);

}

// async function applyFilters (app, spritesContainer) {
//    const colormatrixfilter = new ColorMatrixFilter();
//   colormatrixfilter.alpha = .1;
  
//   const bloomfilter = new AdvancedBloomFilter();
//   bloomfilter.bloomScale = 2;
  
//   const oldFilmFilter = new OldFilmFilter();
//   oldFilmFilter.seed = .9;
//   // oldFilmFilter.noise = .75;
//   let filters = [];


//   if (sceneTags && sceneTags.includes("color matrix")) {
//     filters.push(colormatrixfilter);
//   }
//   if (sceneTags && sceneTags.includes("bloom")) {
//     filters.push(bloomfilter);
//   }
//   if (sceneTags && sceneTags.includes("old film")) {
//     filters.push(oldFilmFilter);
//   }
//   spritesContainer.filters = filters;

//   let count = 0;
//   let enabled = true;
//       let randomFactor = Math.random();


//   app.ticker.add(() => {
    
//     count += 0.01;
//     if (count > 1000) {
//       count = 0;
//       // randomFactor = Math.random();
//     }
//     bloomfilter.bloomScale = Math.sin(randomFactor);
      
//     randomFactor = Math.cos(randomFactor);
//     oldFilmFilter.noise = Math.random();
//     oldFilmFilter.noiseSize = Math.random();
//     oldFilmFilter.seed = Math.random();
//     oldFilmFilter.scratchWidth = Math.random();

//     // Animate the filter
//     const { matrix } = colormatrixfilter;
//       matrix[1] = Math.sin(count) * 3 * randomFactor;
//       matrix[2] = Math.cos(count)  * randomFactor;
//       matrix[3] = Math.cos(count) * 1.5  * randomFactor;
//       matrix[4] = Math.sin(count / 3) * 2  * randomFactor;
//       matrix[5] = Math.sin(count / 2)  * randomFactor;
//       matrix[6] = Math.sin(count / 4)  * randomFactor;
//     });
    

// }

async function addOverlayMap(app, viewport, width, height, videoTexture, spritesContainer) {
 
    const map = videoTexture;
    // map.texture.width = width;
    // map.texture.height = height;
    let mapSpritesData = {};
    mapSpritesData.meta = {};
    mapSpritesData.frames = {};

    const picwidth = width;
    const picheight = height;
    mapsize.x = picwidth;
    mapsize.y = picheight;

    let tilesize = 128;
    const xCount = picwidth / tilesize;
    const yCount = picheight / tilesize;

        viewport.worldWidth = picwidth;                        
        viewport.worldHeight = picheight;   

    console.log("map xCount : " + xCount + " yCount : " + yCount);
  
    //cook the spritesheet json based on image rez and tilesize
    for (let i = 0; i < xCount; i++) {
      const xpos = (i * tilesize);
      for (let k = 0; k < yCount; k++) {
        const tileID = "tile_" + i + "_" + k;
        const ypos = (k * tilesize);
        //add object the spritesheet json!
        mapSpritesData.frames[tileID] = {frame: { x: xpos, y: ypos, w: tilesize, h: tilesize },
                                        sourceSize: { w: tilesize, h: tilesize },
                                        trimmed: false,
                                        spriteSourceSize: { x: 0, y: 0, w: tilesize, h: tilesize },
                                        anchor: { x: 0, y: 0 }};
      }
    }

    mapSpritesData.meta.images = mappicURL;
    console.log("mapSpritesData " + JSON.stringify(mapSpritesData));
    
    // const sheetTexture = await Assets.load(mappicURL);
    
    const spritesheet = new Spritesheet(map, mapSpritesData);
    await spritesheet.parse();
   
    for(var key in mapSpritesData.frames) {

        if(mapSpritesData.frames.hasOwnProperty(key)) {
          // spritesContainer.
          // console.log("mapsprite " + key);
          const sprite = new Sprite(spritesheet.textures[key]);
          // const sprite = new Sprite();
          const keySplit = key.split("_");

          sprite.x = parseInt((keySplit[1]) * tilesize);
          sprite.y = parseInt((keySplit[2]) * tilesize);
          sprite.position.set(parseInt(keySplit[1]) * tilesize, parseInt((keySplit[2]) * tilesize))
          sprite.width = tilesize;
          sprite.height = tilesize;
          sprite.anchor.set(0);
          sprite.interactive = true;
          sprite.buttonMode = true;
          sprite.label = key;
          // sprite.alpha = .1;
          sprite.on('pointerenter', () => {
             if (keydown =="X") {
              sprite.tint = .7 * 0xffffff;
            } else {
              sprite.tint = .3 * 0xffffff;
            }
            // console.log(sprite.label +  " tile entered at " + sprite.position.x + " " + sprite.position.y);
          });
          sprite.on('pointerleave', () => {
            sprite.tint = 0xffffff;
            // console.log("Sprite exit at " + sprite.position.x + " " + sprite.position.y);
          });
          sprite.on('pointerdown', (event) => {
            // sprite.tint = 0xffffff;
          const globalPos = event.data.global; // { x: ..., y: ... }
            // console.log("keydown " + keydown + " for " + sprite.label + " pointerdown at " + sprite.position.x + " " + sprite.position.y);
          const worldPos = viewport.toLocal(globalPos);
              console.log("keydown " + keydown + " for " + sprite.label + " pointerdown globalPos " + globalPos.x + " " + globalPos.y + " vs worldPos " + worldPos.x + " " +worldPos.y);
            
          });

          spritesContainer.addChild(sprite);
          }
        }
    // Center background sprite anchor.
    spritesContainer.anchor = .5;
    
    /**
     * If the preview is landscape, fill the width of the screen
     * and apply horizontal scale to the vertical scale for a uniform fit.
     */

    if (app.screen.width > app.screen.height) {
      spritesContainer.width = app.screen.width - (app.screen.width * .05);
          // background.width = app.screen.width;
      spritesContainer.scale.y = spritesContainer.scale.x;
    } else {
      /**
       * If the preview is square or portrait, then fill the height of the screen instead
       * and apply the scaling to the horizontal scale accordingly.
       */
      spritesContainer.height = app.screen.height - (app.screen.height * .05);
      spritesContainer.scale.x = spritesContainer.scale.y;
    }

    // Position the background sprite in the center of the stage.
    // spritesContainer.x = viewport.width * .05;
    // spritesContainer.y = viewport.height * .05;
    // spritesContainer.a

    addGridOverlay(app, tilesize, xCount, yCount, picwidth, picheight, spritesContainer, viewport);
    // Add the background to the stage.
    // app.stage.addChild(map);
    viewport.addChild(spritesContainer);
  
    viewport.animate({
      position: { x: app.screen.width/2, y: app.screen.height/2 }, // Target center position
      // position: { x: window.innerWidth/2, y: window.innerHeight/2 }, // Target center position
      scale: 1.1, // Target zoom level
      time: 1000, // Animation duration of 1 second
      ease: 'easeInOutQuad' // Using a common easing function
  
    });

        // viewport.zoomPercent(.01, true);    
    // spritesContainer.zIndex = 10;
            
}

export function addBackgroundPictures(app) {

  if (!pictureGroupsData || !pictureGroupsData.length) {
    return;
  }

  // if (videoGroupsData && videoGroupsData.length) { //not yet..
  //   const rnd = Math.random();
  //   if (rnd > .3) {
  //     const vrandIndex = Math.floor(Math.random()*videoGroupsData[0].videos.length);
  //       const v_data = videoGroupsData[0].videos[vrandIndex];
  //       // console.log("video random index is " + vrandIndex + " id is " + v_id);
  //       // const viddata = videoGroupsData[0].videos.find(obj => obj._id === v_id);
  //       console.log("tryna play viddata " + JSON.stringify(v_data));
  //       const video = document.getElementById(v_data._id.toString());
  //     addMap = true;

  //   // const width = video.videoWidth;
  //   // const height = video.videoHeight;
  //   // console.log("VIDEO WIDTH " + video.videoWidth + " HEIGHT " + video.videoHeight);
  //   const texture = Texture.from(video);
  //   video.play();
  //   backgroundPictureGroupSprite.texture = texture;    

  //   }
  // }

  const randomIndex = Math.floor(Math.random()*pictureGroupsData[0].items.length);
  const id = pictureGroupsData[0].items[randomIndex];

  const picdata = pictureGroupsData[0].images.find(obj => obj._id === id);

  let viewOrientation = "landscape";
  if (window.innerWidth < window.innerHeight) {
    viewOrientation = "portrait";
  }
  let picOrientation = "landscape";
    let modFactor = Math.random();
    const signFactor = Math.random();
    let modScaleFactor = Math.random();
    const signScaleFactor = Math.random();


//     spritesContainer.x = app.screen.width / 2;
// spritesContainer.y = app.screen.height / 2;

// // Center bunny sprite in local container coordinates
// spritesContainer.pivot.x = spritesContainer.width / 2;
// spritesContainer.pivot.y = spritesContainer.height / 2;

  // // if (!backgroundPictureGroupSprite) {
  //   const firstTexture = Texture.from(id);
  //   if (firstTexture.width == firstTexture.height) {
  //     picOrientation = "square";
  //   } else if (firstTexture.width < firstTexture.height) {
  //     picOrientation = "portrait";
  //   }
  //   // backgroundPictureGroupSprite.texture = newTexture;

  //   backgroundPictureGroupSprite = Sprite.from(id);

    backgroundPictureGroupSprite.anchor = .5;
    spritesContainer.addChild(backgroundPictureGroupSprite);

    spritesContainer.interactive = true;


    // spritesContainer.anchor = .5;
    // spritesContainer.width = 
    // spritesContainer.x = 0;
    //         spritesContainer.y = viewport.height * .01;
    spritesContainer.height = app.stage.height;
    // let xMod = .5;
    // viewport.anchor = .5;



    // if (viewOrientation == "landscape" && picOrientation == "square") {  
    //   // xMod = .85;
    //     // spritesContainer.x = app.stage.width *.01;
    //   if (signFactor > .5) {
    //     modFactor = (modFactor / 8) * -1
    //   } else {
    //     modFactor = (modFactor / 8);
    //   }
    //         console.log("modFactor iss " + modFactor);
    //   SetViewportVerticalCenter(modFactor);

    //   if (signScaleFactor > .5) {
    //     modScaleFactor = (modScaleFactor / 6) * -1
    //   } else {
    //     modScaleFactor = (modScaleFactor / 6);
    //   }
    // } else if (viewOrientation == "portrait" && picOrientation == "square") {  
    //   xMod = 1;
    //   if (signFactor > .5) {
    //     modFactor = (modFactor / 8) * -1
    //   } else {
    //     modFactor = (modFactor / 8);
    //   }
    //   console.log("modFactor is " + modFactor);
    //   SetViewportVerticalCenter(modFactor);

    //   if (signScaleFactor > .5) {
    //     modScaleFactor = (modScaleFactor / 6) * -1
    //   } else {
    //     modScaleFactor = (modScaleFactor / 6);
    //   }
    // } else {
    //   SetViewportVerticalCenter(2.25);
    // }
  // } else { ///////////// IF SPRITE IS ALREADY SET, JUST SWAP
    //∂∂
    const newTexture = Texture.from(id);
    if (newTexture.width == newTexture.height) {
      picOrientation = "square";
    } else if (newTexture.width < newTexture.height) {
      picOrientation = "portrait";
    }
    backgroundPictureGroupSprite.texture = newTexture;


  // }
  ///////////////////// now gotsa sprite and texture 

  if (app.screen.width > app.screen.height) {
      spritesContainer.width = app.screen.width - (app.screen.width * .1);
          // background.width = app.screen.width;
      spritesContainer.scale.y = spritesContainer.scale.x;       
      
  } else if (app.screen.width < app.screen.height){
    viewOrientation = "portrait";
    spritesContainer.height = app.screen.height - (app.screen.height * .1);
    spritesContainer.scale.x = spritesContainer.scale.y;
  } else {
    viewOrientation = "square";
  }

  // spritesContainer.x = app.screen.width * .25;
  // // spritesContainer.y = app.screen.height * .05;
  // // spritesContainer.anchor = ;
  //   // spritesContainer.width = app.screen.width;
  //       spritesContainer.height = app.screen.height;

      let xMod = .75;    
      // spritesContainer.height = app.stage.height;
  if (viewOrientation == "landscape" && picOrientation == "square") {  
    if (signFactor > .5) {
      modFactor = (modFactor / 4) * -1
    } else {
      modFactor = (modFactor / 4);
    }
    console.log("modFactor is " + modFactor);
    SetViewportVerticalCenter(modFactor);

    if (signScaleFactor > .5) {
      modScaleFactor = (modScaleFactor / 6) * -1
    } else {
      modScaleFactor = (modScaleFactor / 6);
    }
  } else {
    xMod = 1.1;
    console.log("modFactor is 2.25");
    SetViewportVerticalCenter(2.25);
  }
  applyFilters(app, spritesContainer);
 
  // const colormatrixfilter = new ColorMatrixFilter();
  // colormatrixfilter.alpha = .1;
  
  // const bloomfilter = new AdvancedBloomFilter();
  // bloomfilter.bloomScale = 2;
  
  // const oldFilmFilter = new OldFilmFilter();
  // oldFilmFilter.seed = .9;
  // // oldFilmFilter.noise = .75;
  // let filters = [];


  // if (sceneTags && sceneTags.includes("color matrix")) {
  //   filters.push(colormatrixfilter);
  // }
  // if (sceneTags && sceneTags.includes("bloom")) {
  //   filters.push(bloomfilter);
  // }
  // if (sceneTags && sceneTags.includes("old film")) {
  //   filters.push(oldFilmFilter);
  // }
  // spritesContainer.filters = filters;

  // let count = 0;
  // let enabled = true;
  //     let randomFactor = Math.random();


  // app.ticker.add(() => {
    
  //   count += 0.01;
  //   if (count > 1000) {
  //     count = 0;
  //     // randomFactor = Math.random();
  //   }
  //   bloomfilter.bloomScale = Math.sin(randomFactor);
      
  //   randomFactor = Math.cos(randomFactor);
  //   oldFilmFilter.noise = Math.random();
  //   oldFilmFilter.noiseSize = Math.random();
  //   oldFilmFilter.seed = Math.random();
  //   oldFilmFilter.scratchWidth = Math.random();

  //   // Animate the filter
  //   const { matrix } = colormatrixfilter;
  //     matrix[1] = Math.sin(count) * 3 * randomFactor;
  //     matrix[2] = Math.cos(count)  * randomFactor;
  //     matrix[3] = Math.cos(count) * 1.5  * randomFactor;
  //     matrix[4] = Math.sin(count / 3) * 2  * randomFactor;
  //     matrix[5] = Math.sin(count / 2)  * randomFactor;
  //     matrix[6] = Math.sin(count / 4)  * randomFactor;
  //   });
  //   // }
  //     console.log("modFactor " + modFactor + " modScaleFactor " + modScaleFactor + " viewOrientation " + viewOrientation + " picOrientation " + 
  //         picOrientation + " viewportVerticalCenter" + viewportVerticalCenter+ " viewportHorizontalCenter" + viewportHorizontalCenter);

      viewport.animate({
      position: { x: 0, y:0}, // Target center position
      // position: { x: window.innerWidth/viewportHorizontalCenter, y: window.innerHeight/viewportVerticalCenter }, // Target center position
      scale: 1.1 + modScaleFactor, // Target zoom level
      time: 3000, // Animation duration of 1 second
      ease: 'easeInOutQuad' // Using a common easing function
    });

}

export async function addMap(app, viewport, spritesContainer) {
  // Create a background sprite.

    const map = Sprite.from('map'); //need to ref it for w/h below
    let mapSpritesData = {};
    mapSpritesData.meta = {};
    mapSpritesData.frames = {};

    const picwidth = map.texture.width;
    const picheight = map.texture.height;
    mapsize.x = picwidth;
    mapsize.y = picheight;
    
      // viewport.worldWidth = picwidth;
      // viewport.worldHeight = picheight;

    let tilesize = 128;
    const xCount = picwidth / tilesize;
    const yCount = picheight / tilesize;

    console.log("map xCount : " + xCount + " yCount : " + yCount);
  
    // viewport.width = picwidth;
    // viewport.height = picheight;
    // viewport.worldHeight = picheight;
    // viewport.worldWidth = picwidth;
    //cook the spritesheet json based on image rez and tilesize
    for (let i = 0; i < xCount; i++) {
      const xpos = (i * tilesize);
      for (let k = 0; k < yCount; k++) {
        const tileID = "tile_" + i + "_" + k;
        const ypos = (k * tilesize);
        //add object the spritesheet json!
        mapSpritesData.frames[tileID] = {frame: { x: xpos, y: ypos, w: tilesize, h: tilesize },
                                        sourceSize: { w: tilesize, h: tilesize },
                                        trimmed: false,
                                        spriteSourceSize: { x: 0, y: 0, w: tilesize, h: tilesize },
                                        anchor: { x: 0, y: 0 }};
      }
    }

    mapSpritesData.meta.images = mappicURL;
    // console.log("mapSpritesData " + JSON.stringify(mapSpritesData));
    
    const sheetTexture = await Assets.load(mappicURL);
    const spritesheet = new Spritesheet(sheetTexture, mapSpritesData);
    await spritesheet.parse();
   
    for(var key in mapSpritesData.frames) {

        if(mapSpritesData.frames.hasOwnProperty(key)) {
          // spritesContainer.
          // console.log("mapsprite " + key);
          const sprite = new Sprite(spritesheet.textures[key]);
          const keySplit = key.split("_");

          sprite.x = parseInt((keySplit[1]) * tilesize);
          sprite.y = parseInt((keySplit[2]) * tilesize);
          sprite.position.set(parseInt(keySplit[1]) * tilesize, parseInt((keySplit[2]) * tilesize))
          sprite.width = tilesize;
          sprite.height = tilesize;
          sprite.anchor.set(0);
          sprite.interactive = true;
          sprite.buttonMode = true;
          sprite.label = key;
                    // sprite.alpha = .1;
          sprite.on('pointerenter', () => {
            
            if (keydown =="X") {
              sprite.tint = .35 * 0xffffff;
            } else {
              sprite.tint = .625 * 0xffffff;
            }
            // console.log(sprite.label +  " tile entered at " + sprite.position.x + " " + sprite.position.y);
          });
          sprite.on('pointerleave', () => {
            sprite.tint = 0xffffff;
            // console.log("Sprite exit at " + sprite.position.x + " " + sprite.position.y);
          });
         

          spritesContainer.addChild(sprite);
          }
        }
        spritesContainer.interactive = true;
        // Center background sprite anchor.
        spritesContainer.anchor = 0.5;
        spritesContainer.on('pointerup', (event) => {
          // ... handle the event 
          if (keydown != "T") {
              const globalPos = event.data.global; // { x: ..., y: ... }
                // console.log("keydown " + keydown + " for " + sprite.label + " pointerdown at " + sprite.position.x + " " + sprite.position.y);
              const worldPos = spritesContainer.toLocal(globalPos);
                // console.log("spritesContainer click keydown " + keydown + " pointerdown " + event.x + " " + event.y + "  " + event.screenX + " " + event.screenY + " globalPos " + globalPos.x + " " + globalPos.y + " vs worldPos " + worldPos.x + " " +worldPos.y);
                SetSelectedPosition('', worldPos.x.toFixed(2) , worldPos.y.toFixed(2));
          }
          if (keydown == "X") {
            // CreateNewLocation();
            AddLocation(app, viewport, spritesContainer);
          }
        });
    /**
     * If the preview is landscape, fill the width of the screen
     * and apply horizontal scale to the vertical scale for a uniform fit.
     */

        // if (app.screen.width > app.screen.height) {
        //   spritesContainer.width = app.screen.width - (app.screen.width * .1);
        //       // background.width = app.screen.width;
        //   spritesContainer.scale.y = spritesContainer.scale.x;
        // } else {
        //   /**
        //    * If the preview is square or portrait, then fill the height of the screen instead
        //    * and apply the scaling to the horizontal scale accordingly.
        //    */
        //   spritesContainer.height = app.screen.height - (app.screen.height * .1);
        //   spritesContainer.scale.x = spritesContainer.scale.y;
        // }

    // Position the background sprite in the center of the stage.
    spritesContainer.x = app.screen.width * .05;
    spritesContainer.y = app.screen.height * .05;

    addGridOverlay(app, tilesize, xCount, yCount, picwidth, picheight, spritesContainer, viewport);
    // Add the background to the stage.
    // app.stage.addChild(map);

    viewport.addChild(spritesContainer);
    


    // spritesContainer.zIndex = 10;
            
}
