import { Sprite } from 'pixi';

export function addBackground(app, viewport) {
  
    const background = Sprite.from('background');

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
        viewport.addChild(background);
}


export function addMap(app, viewport) {
  // Create a background sprite.

    const map = Sprite.from('map');

    // Center background sprite anchor.
    map.anchor.set(0.5);

    /**
     * If the preview is landscape, fill the width of the screen
     * and apply horizontal scale to the vertical scale for a uniform fit.
     */

    if (app.screen.width > app.screen.height) {
      map.width = app.screen.width - (app.screen.width * .1);
          // background.width = app.screen.width;
      map.scale.y = map.scale.x;
    } else {
      /**
       * If the preview is square or portrait, then fill the height of the screen instead
       * and apply the scaling to the horizontal scale accordingly.
       */
      map.height = app.screen.height - (app.screen.height * .1);
      map.scale.x = background.scale.y;
    }

    // Position the background sprite in the center of the stage.
    map.x = app.screen.width / 2;
    map.y = app.screen.height / 2;

    // Add the background to the stage.
    // app.stage.addChild(map);
            viewport.addChild(map);
  
}
