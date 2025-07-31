import { Sprite, Container, Assets, Spritesheet, TilingSprite, Texture, VideoSource } from 'pixi';
// import { CompositeTilemap } from 'pixi-tilemap';
import { mappicURL, backgroundVideoURL } from './vtt_main.mjs';
import { addGridOverlay } from './addOverlay.mjs';

export let mapsize = {};

export let background;

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


export function addBackgroundVideo(app, viewport, spritesContainer) {

  // console.log("tryna add background video!");

  // const videoElement = document.createElement('video')
  //     videoElement.src = backgroundVideoURL;
  //     videoElement.crossOrigin = "anonymous";

  //     const videoSource = new VideoSource({
  //       updateFPS: 60,
  //       muted: false,
  //       loop: true,
  //       autoPlay: true,
  //       crossOrigin: 'anonymous',
  //       preload: true,
  //       resource: videoElement
  //     })
  const video = document.getElementById("bgVideo");
  let width = video.videoWidth;
  let height = video.videoHeight;
  // console.log("VIDEO WIDTH " + video.videoWidth + " HEIGHT " + video.videoHeight);
  const texture = Texture.from(video);

  //     videoSource.load().then( loadedSource => {
            // const videoTexture = new Texture({ source: backgroundVideoURL, crossOrigin: 'anonymous' });     
              // const videoTexture = await Assets.load(backgroundVideoURL);     
            // const videoTexture = Texture.from('backgroundVideo');
            const backgroundVideo = new Sprite(texture);
            
            // Add sprite to the stage
      // videoTexture.baseTexture.resource.source.loop = true;
      // let video = document.createElement('video');
      // video.src = 'path/to/your/video.mp4';
      // video.preload = 'auto'; // Optional: Preload the video for faster playback
      // video.loop = true; // This is the key for looping
      // video.muted = true; // Optional: Mute the video for autoplay in some browsers
      // video.play(); // Start playing the video
    
      // let backgroundVideo = Sprite.from(videoTexture);
      // videoTexture.source.loop = true;
      // backgroundVideo.source.loop = true;
      // Center backgroundVideo sprite anchor.
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
        // Add the backgroundVideo to the stage.
        // app.stage.addChild(backgroundVideo);
    
        // spritesContainer.addChild(backgroundVideo);
    if (viewport) {
      // viewport.addChild(backgroundVideo);
    } else {
      // app.stage.addChild(backgroundVideo);
    }
    
    addOverlayMap(app, viewport, width, height, texture, spritesContainer);
          // });
}


async function addOverlayMap(app, viewport, width, height, videoTexture, spritesContainer) {
  // Create a background sprite.

    // const map = Sprite.from('map'); //need to ref it for w/h below\
    // const spritesContainer = new Container();
    // const map = Texture.from('backgroundVideo');
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
          sprite.on('pointerenter', () => {
            sprite.tint = .3 * 0xffffff;
            // console.log(sprite.label +  " tile entered at " + sprite.position.x + " " + sprite.position.y);
          });
          sprite.on('pointerleave', () => {
            sprite.tint = 0xffffff;
            // console.log("Sprite exit at " + sprite.position.x + " " + sprite.position.y);
          });
          sprite.on('pointerdown', () => {
            // sprite.tint = 0xffffff;

            console.log(sprite.label + " pointerdown at " + sprite.position.x + " " + sprite.position.y);
            // viewport.snap(sprite.getGlobalPosition().x, sprite.getGlobalPosition().y);
          });

          spritesContainer.addChild(sprite);
          }
        }
    // Center background sprite anchor.
    spritesContainer.anchor = 0.5;
    
    /**
     * If the preview is landscape, fill the width of the screen
     * and apply horizontal scale to the vertical scale for a uniform fit.
     */

    if (app.screen.width > app.screen.height) {
      spritesContainer.width = app.screen.width - (app.screen.width * .1);
          // background.width = app.screen.width;
      spritesContainer.scale.y = spritesContainer.scale.x;
    } else {
      /**
       * If the preview is square or portrait, then fill the height of the screen instead
       * and apply the scaling to the horizontal scale accordingly.
       */
      spritesContainer.height = app.screen.height - (app.screen.height * .1);
      spritesContainer.scale.x = spritesContainer.scale.y;
    }

    // Position the background sprite in the center of the stage.
    spritesContainer.x = app.screen.width * .05;
    spritesContainer.y = app.screen.height * .05;

    addGridOverlay(app, tilesize, xCount, yCount, picwidth, picheight, spritesContainer, viewport);
    // Add the background to the stage.
    // app.stage.addChild(map);
    viewport.addChild(spritesContainer);
        // viewport.zoomPercent(.01, true);    
    // spritesContainer.zIndex = 10;
            
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

    let tilesize = 64;
    const xCount = picwidth / tilesize;
    const yCount = picheight / tilesize;

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
          sprite.on('pointerenter', () => {
            sprite.tint = .3 * 0xffffff;
            // console.log(sprite.label +  " tile entered at " + sprite.position.x + " " + sprite.position.y);
          });
          sprite.on('pointerleave', () => {
            sprite.tint = 0xffffff;
            // console.log("Sprite exit at " + sprite.position.x + " " + sprite.position.y);
          });
          sprite.on('pointerdown', () => {
            // sprite.tint = 0xffffff;

            console.log(sprite.label + " pointerdown at " + sprite.position.x + " " + sprite.position.y);
            // viewport.snap(sprite.getGlobalPosition().x, sprite.getGlobalPosition().y);
          });

          spritesContainer.addChild(sprite);
          }
        }
    // Center background sprite anchor.
    spritesContainer.anchor = 0.5;
    
    /**
     * If the preview is landscape, fill the width of the screen
     * and apply horizontal scale to the vertical scale for a uniform fit.
     */

    if (app.screen.width > app.screen.height) {
      spritesContainer.width = app.screen.width - (app.screen.width * .1);
          // background.width = app.screen.width;
      spritesContainer.scale.y = spritesContainer.scale.x;
    } else {
      /**
       * If the preview is square or portrait, then fill the height of the screen instead
       * and apply the scaling to the horizontal scale accordingly.
       */
      spritesContainer.height = app.screen.height - (app.screen.height * .1);
      spritesContainer.scale.x = spritesContainer.scale.y;
    }

    // Position the background sprite in the center of the stage.
    spritesContainer.x = app.screen.width * .05;
    spritesContainer.y = app.screen.height * .05;

    addGridOverlay(app, tilesize, xCount, yCount, picwidth, picheight, spritesContainer, viewport);
    // Add the background to the stage.
    // app.stage.addChild(map);
    viewport.addChild(spritesContainer);
    // spritesContainer.zIndex = 10;
            
}
