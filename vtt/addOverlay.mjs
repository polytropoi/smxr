import { Texture, TilingSprite, Graphics, Container } from 'pixi';

// Reference to the water overlay.
let overlay;

function buildGrid(app, tilesize, xCount, yCount, mapwidth, mapheight, graphics) {
  // Draw 10 vertical lines spaced 10 pixels apart
  for (let i = 0; i < xCount; i++) {
    // Move to top of each line (x = i*10, y = 0)
    graphics
      .moveTo(i * tilesize, 0)
      // Draw down to bottom (x = i*10, y = 100)
      .lineTo(i * tilesize, mapheight);
  }

  // Draw 10 horizontal lines spaced 10 pixels apart
  for (let i = 0; i < yCount; i++) {
    // Move to start of each line (x = 0, y = i*10)
    graphics
      .moveTo(0, i * tilesize)
      // Draw across to end (x = 100, y = i*10)
      .lineTo(mapwidth, i * tilesize);
  }

  return graphics;
}

export function addWaterOverlay(app) {
  // Create a water texture object.
  const texture = Texture.from('overlay');

  // Create a tiling sprite with the water texture and specify the dimensions.
  overlay = new TilingSprite({
    texture,
    width: app.screen.width,
    height: app.screen.height,
  });

  // Add the overlay to the stage.
  app.stage.addChild(overlay);
}

export function animateWaterOverlay(app, time) {
  // Extract the delta time from the Ticker object.
  const delta = time.deltaTime;

  // Animate the overlay.
  overlay.tilePosition.x -= delta;
  overlay.tilePosition.y -= delta;
}


export function addGridOverlay(app, tilesize, xcount, ycount, mapwidth, mapheight, spritesContainer, viewport) {
    //Create a Graphics object and draw a pixel-perfect line
  // let graphics = new Graphics().moveTo(0, 0).lineTo(window.width, window.height).stroke({ color: 0xff0000, pixelLine: true });
  const gridPixel = buildGrid(app, tilesize, xcount, ycount, mapwidth, mapheight, new Graphics()).stroke({ color: 0x8a8a8a, pixelLine: true, width: 1 });

  // Add it to the stage
  // app.stage.addChild(graphics);
    // Create a container to hold both grids
  // const container = new Container();

  spritesContainer.addChild(gridPixel);
  // if (app.screen.width > app.screen.height) {
  //   // background.width = app.screen.width - (app.screen.width * .2);
  //   container.x = app.screen.width - (app.screen.width * .2);
  // container.y = app.screen.height / 2;
  //       // background.width = app.screen.width;
  //   // background.scale.y = background.scale.x;
  // } else {
  //   /**
  //    * If the preview is square or portrait, then fill the height of the screen instead
  //    * and apply the scaling to the horizontal scale accordingly.
  //    */
  //   // background.height = app.screen.height - (app.screen.height * .2);
  //   // background.scale.x = background.scale.y;
  //   container.x = app.screen.width / 2;
  // container.y = app.screen.height - (app.screen.height * .2);
    
  // }

  // // Center the container on screen
  // container.x = app.screen.width / 2;
  // container.y = app.screen.height / 2;
  //   container.x = 0;
  // container.y = 0;
  // app.stage.addChild(container);
          // viewport.addChild(container);
}
