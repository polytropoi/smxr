import { DisplacementFilter, Sprite, ColorMatrixFilter } from 'pixi';
// import 'pixi/advanced-blend-modes';  
import { background } from './addBackground.mjs';

import { sceneTags} from './vtt_main.mjs';

import { AdvancedBloomFilter, ReflectionFilter, OldFilmFilter, HslAdjustmentFilter } from '@pixi/filters';

export function addDisplacementEffect(app, container) {
  // Create a sprite from the preloaded displacement asset.
  console.log("tryna add displacement to " + container);
  const sprite = Sprite.from('displacement');

  // Set the base texture wrap mode to repeat to allow the texture UVs to be tiled and repeated.
  sprite.texture.baseTexture.wrapMode = 'repeat';

  app.stage.addChild(sprite); //
  // sprite.anchor = .5;
  // Create a displacement filter using the sprite texture.
  const filter = new DisplacementFilter({
    sprite,
    scale: 150,
  });

  // Add the filter to the stage.
 container.filters = [filter];

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
  const hslModFilter = new HslAdjustmentFilter();
  const reflectionFilter = new ReflectionFilter();
  oldFilmFilter.seed = .9;
  // oldFilmFilter.noise = .75;
  let filters = [];

  //   const displacementSprite = await Sprite.from('displacement');
  //       app.stage.addChild(displacementSprite); //
  //   // Set the base texture wrap mode to repeat to allow the texture UVs to be tiled and repeated.
  //   displacementSprite.texture.baseTexture.wrapMode = 'repeat';


  //   const displacementFilter = new DisplacementFilter({
  //   displacementSprite,
  //   scale: 50,
  // });

  if (sceneTags && sceneTags.includes("color matrix")) {
    filters.push(colormatrixfilter);
  }
  if (sceneTags && sceneTags.includes("bloom")) {
    filters.push(bloomfilter);
  }
  if (sceneTags && sceneTags.includes("old film")) {
    filters.push(oldFilmFilter);
  } 
  if (sceneTags && sceneTags.includes("hsl mod")) {
    filters.push(hslModFilter);
  } 
  if (sceneTags && sceneTags.includes("reflection")) {
    // reflectionFilter.mirror = false;
    filters.push(reflectionFilter);
  } 
  // if (sceneTags && sceneTags.includes("displacement")) {

  //   filters.push(displacementFilter);
  //     animateEffect(app, displacementSprite);
  // }
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
      
    // randomFactor = Math.cos(randomFactor);
    oldFilmFilter.noise = Math.random();
    oldFilmFilter.noiseSize = Math.random();
    oldFilmFilter.seed = Math.random();
    oldFilmFilter.scratchWidth = Math.random();
    hslModFilter.hue = lerp(-80, 80, Math.sin(count) / 2);
    // reflectionFilter.boundary = lerp(.25, .75, count / 100);
    // reflectionFilter.alpha = .1;
    // console.log("hsl mod " + hslModFilter.hue);

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

function lerp(startValue, endValue, amount) {
  return startValue + amount * (endValue - startValue);
}

// Example usage:
const value1 = 0;
const value2 = 100;

// Get the value halfway between 0 and 100
const halfwayValue = lerp(value1, value2, 0.5);
console.log(`Halfway value: ${halfwayValue}`); // Output: Halfway value: 50

// Get the value 25% of the way between 0 and 100
const quarterValue = lerp(value1, value2, 0.25);
console.log(`Quarter value: ${quarterValue}`); // Output: Quarter value: 25

// Get the value 75% of the way between 0 and 100
const threeQuarterValue = lerp(value1, value2, 0.75);
console.log(`Three-quarter value: ${threeQuarterValue}`); // Output: Three-quarter value: 75