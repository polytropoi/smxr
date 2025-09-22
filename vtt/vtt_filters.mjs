import { DisplacementFilter, Sprite, ColorMatrixFilter } from 'pixi';
// import 'pixi/advanced-blend-modes';  
import { background } from './addBackground.mjs';

import { sceneTags} from './vtt_main.mjs';

import { AdvancedBloomFilter, ReflectionFilter, OldFilmFilter } from '@pixi/filters';

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


export async function applyFilters (app, spritesContainer) {
   const colormatrixfilter = new ColorMatrixFilter();
  colormatrixfilter.alpha = .1;
  
  const bloomfilter = new AdvancedBloomFilter();
  bloomfilter.bloomScale = 2;
  
  const oldFilmFilter = new OldFilmFilter();
  oldFilmFilter.seed = .9;
  // oldFilmFilter.noise = .75;
  let filters = [];


  if (sceneTags && sceneTags.includes("color matrix")) {
    filters.push(colormatrixfilter);
  }
  if (sceneTags && sceneTags.includes("bloom")) {
    filters.push(bloomfilter);
  }
  if (sceneTags && sceneTags.includes("old film")) {
    filters.push(oldFilmFilter);
  }
  spritesContainer.filters = filters;

  let count = 0;
  let enabled = true;
      let randomFactor = Math.random();


  app.ticker.add(() => {
    
    count += 0.01;
    if (count > 1000) {
      count = 0;
      // randomFactor = Math.random();
    }
    bloomfilter.bloomScale = Math.sin(randomFactor);
      
    randomFactor = Math.cos(randomFactor);
    oldFilmFilter.noise = Math.random();
    oldFilmFilter.noiseSize = Math.random();
    oldFilmFilter.seed = Math.random();
    oldFilmFilter.scratchWidth = Math.random();

    // Animate the filter
    const { matrix } = colormatrixfilter;
      matrix[1] = Math.sin(count) * 3 * randomFactor;
      matrix[2] = Math.cos(count)  * randomFactor;
      matrix[3] = Math.cos(count) * 1.5  * randomFactor;
      matrix[4] = Math.sin(count / 3) * 2  * randomFactor;
      matrix[5] = Math.sin(count / 2)  * randomFactor;
      matrix[6] = Math.sin(count / 4)  * randomFactor;
    });
    

}