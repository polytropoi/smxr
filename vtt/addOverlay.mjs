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
 
  // let graphics = new Graphics().moveTo(0, 0).lineTo(window.width, window.height).stroke({ color: 0xff0000, pixelLine: true });
  const gridPixel = buildGrid(app, tilesize, xcount, ycount, mapwidth, mapheight, new Graphics()).stroke({ color: 0x4d4d4d, pixelLine: true, width: .1 });

  spritesContainer.addChild(gridPixel);

}
