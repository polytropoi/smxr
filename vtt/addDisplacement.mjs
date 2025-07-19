import { DisplacementFilter, Sprite } from 'pixi';

import { background } from './addBackground.mjs';

export function addDisplacementEffect(app) {
  // Create a sprite from the preloaded displacement asset.
  const sprite = Sprite.from('displacement');

  // Set the base texture wrap mode to repeat to allow the texture UVs to be tiled and repeated.
  sprite.texture.baseTexture.wrapMode = 'repeat';

  app.stage.addChild(sprite); //
  // sprite.anchor = .5;
  // Create a displacement filter using the sprite texture.
  const filter = new DisplacementFilter({
    sprite,
    scale: 50,
  });

  // Add the filter to the stage.
 background.filters = [filter];


  animateEffect(app, sprite);
}

function animateEffect (app, sprite) {
  console.log("tryna animate effect!");
        app.ticker.add(() => {
        // sprite.rotation += 0.1;      // Rotate
        // console.log("tryna anim the displacement sprite!");
        sprite.x++;
    });

}