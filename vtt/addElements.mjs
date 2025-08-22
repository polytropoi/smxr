

import { Application, Assets, Point, AnimatedSprite, Container, Sprite, Spritesheet } from 'pixi';
import { AdvancedBloomFilter, ReflectionFilter } from '@pixi/filters';
import { PlayTriggerWithTag } from '../connect/media.js';
import { mapsize } from './addBackground.mjs';

  const allBlendModes = [
    'normal',
    'add',
    'screen',
    'darken',
    'lighten',
    'color-dodge',
    'color-burn',
    'linear-burn',
    'linear-dodge',
    'linear-light',
    'hard-light',
    'soft-light',
    'pin-light',
    'difference',
    'exclusion',
    'overlay',
    'saturation',
    'color',
    'luminosity',
    'add-npm',
    'subtract',
    'divide',
    'vivid-light',
    'hard-mix',
    'negation',
  ];


// export function addFishes(app, fishes) {
//   // Create a container to hold all the fish sprites.
//   const fishContainer = new Container();

//   // Add the fish container to the stage.
//   app.stage.addChild(fishContainer);

//   const fishCount = 20;
//   const fishAssets = ['fish1', 'fish2', 'fish3', 'fish4', 'fish5'];

//   // Create a fish sprite for each fish.
//   for (let i = 0; i < fishCount; i++) {
//     // Cycle through the fish assets for each sprite.
//     const fishAsset = fishAssets[i % fishAssets.length];

//     // Create a fish sprite.
//     const fish = Sprite.from(fishAsset);

//     // Center the sprite anchor.
//     fish.anchor.set(0.5);

//     // Assign additional properties for the animation.
//     fish.direction = Math.random() * Math.PI * 2;
//     fish.speed = 2 + Math.random() * 2;
//     fish.turnSpeed = Math.random() - 0.8;

//     // Randomly position the fish sprite around the stage.
//     fish.x = Math.random() * app.screen.width;
//     fish.y = Math.random() * app.screen.height;

//     // Randomly scale the fish sprite to create some variety.
//     fish.scale.set(0.5 + Math.random() * 0.2);

//     // Add the fish sprite to the fish container.
//     fishContainer.addChild(fish);

//     // Add the fish sprite to the fish array.
//     fishes.push(fish);
//   }
// }

// export function animateFishes(app, fishes, time) {
//   // Extract the delta time from the Ticker object.
//   const delta = time.deltaTime;

//   // Define the padding around the stage where fishes are considered out of sight.
//   const stagePadding = 100;
//   const boundWidth = app.screen.width + stagePadding * 2;
//   const boundHeight = app.screen.height + stagePadding * 2;

//   // Iterate through each fish sprite.
//   fishes.forEach((fish) => {
//     // Animate the fish movement direction according to the turn speed.
//     fish.direction += fish.turnSpeed * 0.01;

//     // Animate the fish position according to the direction and speed.
//     fish.x += Math.sin(fish.direction) * fish.speed;
//     fish.y += Math.cos(fish.direction) * fish.speed;

//     // Apply the fish rotation according to the direction.
//     fish.rotation = -fish.direction - Math.PI / 2;

//     // Wrap the fish position when it goes out of bounds.
//     if (fish.x < -stagePadding) {
//       fish.x += boundWidth;
//     }
//     if (fish.x > app.screen.width + stagePadding) {
//       fish.x -= boundWidth;
//     }
//     if (fish.y < -stagePadding) {
//       fish.y += boundHeight;
//     }
//     if (fish.y > app.screen.height + stagePadding) {
//       fish.y -= boundHeight;
//     }
//   });
// }

export async function addAnimatedSprite (app, texture, spriteData, count, elements, viewport, spritesContainer) {

// const sprite = 'sprites1';
    // let asset = sprites.
  console.log("spritesData " + JSON.stringify(spriteData));
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


  app.stage.eventMode = 'static';
  app.stage.hitArea = app.screen;
  app.stage.on('pointerup', onDragEnd);
  app.stage.on('pointerupoutside', onDragEnd);
  let dragTarget = null;

  function onDragMove(event) {
 
    if (dragTarget) {
      console.log("tryna dragmove..");
      dragTarget.parent.toLocal(event.global, null, dragTarget.position);
    }
  }

  function onDragStart(target) {
    console.log("dragstart!");
    // Store a reference to the data
    // * The reason for this is because of multitouch *
    // * We want to track the movement of this particular touch *
    // this.alpha = 0.5;
// viewport.pausePlugin('drag')
    if (viewport) {
        viewport.plugins.pause("drag");
    }

    dragTarget = target;
    app.stage.on('pointermove', onDragMove);
  }

  function onDragEnd() {
    if (dragTarget) {
      app.stage.off('pointermove', onDragMove);
      dragTarget.alpha = 1;
      dragTarget = null;
      if (viewport) {
        viewport.plugins.resume("drag");
      }
     
    }
  }

    const elementCount = count;
    const elementContainer = new Container();

     if (viewport) {
      // spriteLayer.attach(elementContainer);

      // viewport.addChild(spriteLayer);
    } else {
      app.stage.addChild(elementContainer);
    }
    // app.stage.addChild(elementContainer);
    // viewport.addChild(elementContainer);
    let anims = [];
    for (let i = 0; i < elementCount; i++) {
        const sheet = new Spritesheet(texture, spriteData);
        await sheet.parse();
        // console.log('Spritesheet ready to use!');
            //     await Assets.load(spriteData);
        const frames = [];
        var count = 0;
        for(var key in spriteData.frames) {
        if(spriteData.frames.hasOwnProperty(key)) {
            // console.log(key);
            // frames.push(Texture.from(key));
                frames.push(sheet.textures[key]);
                count++;
            }
        }

        // let length = spriteData.frames.length;
        // console.log("frames " + count);
        

        const animatedSprite = new AnimatedSprite(frames);

        /*
        * An animatedSpriteatedSprite inherits all the properties of a PIXI sprite
        * so you can change its position, its anchor, mask it, etc
        */
        // anim.x = app.screen.width / 2;
        // anim.y = app.screen.height / 2;

        let scaleFactor = 1;
        if (mapsize.x) {
          scaleFactor = mapsize.x / 2000;
        } 
        animatedSprite.anchor.set(0.5);
        animatedSprite.animationSpeed = Math.random();
        animatedSprite.width = 256 * scaleFactor;
        animatedSprite.height = 256 * scaleFactor;
        

         // Assign additional properties for the animation.
        // anim.direction = Math.random() * Math.PI * 2;
        animatedSprite.direction = Math.random() * Math.PI * 2; 
        animatedSprite.speed = Math.random();
        animatedSprite.turnSpeed = Math.random() - 0.8;
        animatedSprite.interactive = true;

        animatedSprite.buttonMode = true;
        animatedSprite.scale.set(0.5 + Math.random() * .1);

        animatedSprite.acceleration = new Point(0);
        animatedSprite.zIndex = 10;
        
        // animatedSprite.on('pointerdown', onDragStart, animatedSprite);
        animatedSprite.on('pointerdown', () => {
            // sprite.tint = 0xffffff;

            console.log(" pointerdown at " + animatedSprite.position.x + " " + animatedSprite.position.y);
            onDragStart(animatedSprite);
            // viewport.snap(sprite.getGlobalPosition().x, sprite.getGlobalPosition().y);
          });
        
        if (viewport) {
          animatedSprite.x = Math.random() * mapsize.x;
          animatedSprite.y = Math.random() * mapsize.y;
          // viewport.addChild(animatedSprite);
          console.log("tryna add sprite at " + animatedSprite.x + " " + animatedSprite.y )
          spritesContainer.addChild(animatedSprite);
          elements.push(animatedSprite);
        } else {
          animatedSprite.x = Math.random() * app.screen.width - 100 ;
          animatedSprite.y = Math.random() * app.screen.height - 100;
          elementContainer.addChild(animatedSprite);
          elements.push(animatedSprite);
        }
          animatedSprite.play();
        // app.stage.addChild(anim);
      if (viewport) {
        // viewport.addChild(elementContainer);
      } else {
        app.stage.addChild(elementContainer);
      }
    }
}

export function addSprite (app, sprite, viewport) {
  console.log("tryna addSprite for location " + sprite.locationData.name);
  sprite.anchor.set(0.5);
  sprite.position.set(app.screen.width / 2 + (sprite.locationData.x * 10), app.screen.height / 2 + (sprite.locationData.y * 10));
  sprite.scale.x = sprite.locationData.xscale;
  sprite.scale.y = sprite.locationData.yscale;

    // sprite.x = sprite.locationData.x;
    // sprite.y = sprite.locationData.y;
      const filter = new AdvancedBloomFilter();
      filter.bloomScale = 2;
      // const filter2 = new ReflectionFilter();
      // filter2.alpha = [1, .5];
    // sprite.blendMode = 'add';
    sprite.filters = [filter];
    sprite.alpha = .85;
    if (viewport) {
      viewport.addChild(sprite);
    } else {
      app.stage.addChild(sprite);
    }

    let count = 0;
    app.ticker.add(() => {
      count += .05;
        sprite.scale.x = (1 + Math.sin(count) * 0.04) * sprite.locationData.xscale;
        sprite.scale.y = (1 + Math.cos(count) * 0.04) * sprite.locationData.yscale;
    });
}

export function spriteFilter (app, sprite, filter, blendmode) {
  // if (filter == "HardMixBlend") {
  //   sprite.n; = [new HardMixBlend()];
  // }
}

export function animateElements(app, elements, time, viewport) {
  // Extract the delta time from the Ticker object.
  const delta = time.deltaTime;
    let boundWidth;
    let boundHeight;
      const stagePadding = 100;
  if (viewport) {
    // const stagePadding = 10;
    boundWidth = viewport.width  + stagePadding * 2;
    boundHeight = viewport.height  + stagePadding * 2;
  } else {

    boundWidth = app.screen.width + stagePadding * 2;
    boundHeight = app.screen.height + stagePadding * 2;
  }
  // Define the padding around the stage where fishes are considered out of sight.
 

  // // Iterate through each fish sprite.
  // elements.forEach((element) => {
  //   // Animate the fish movement direction according to the turn speed.
  //   element.direction += element.turnSpeed * 0.01;

  //   // Animate the fish position according to the direction and speed.
  //   element.x += Math.sin(element.direction) * element.speed;
  //   element.y += Math.cos(element.direction) * element.speed;

  //   // Apply the fish rotation according to the direction.
  //   // element.rotation = -element.direction - Math.PI;
  //   element.rotation = -element.direction - Math.PI / 2;

  //   // Wrap the fish position when it goes out of bounds.
  //   if (element.x < -stagePadding) {
  //     element.x += boundWidth;
  //   }
  //   if (element.x > app.screen.width + stagePadding) {
  //     element.x -= boundWidth;
  //   }
  //   if (element.y < -stagePadding) {
  //     element.y += boundHeight;
  //   }
  //   if (element.y > app.screen.height + stagePadding) {
  //     element.y -= boundHeight;
  //   }


  // });

    for(let i=0;i<elements.length;i++){
        for(let j=i+1;j<elements.length;j++){
            //are the sprites closer than 40px together 
            if(calculateDistanceBetweenTwoPoints(elements[i],elements[j])<100){
              console.log("gotsa collision!");
                elements[i].tint = getRandomColor();
                elements[j].tint = getRandomColor();
                PlayTriggerWithTag('hit');
                // collisionResponse(elements[i], elements[j]);
            }
        }
    }

    
  
}

function calculateDistanceBetweenTwoPoints(point1, point2) {
    let xx = point1.x - point2.x;
    let yy = point1.y - point2.y;
    let distance = Math.sqrt((xx * xx) + (yy * yy));
    return distance
}
function getRandomColor() {
  var letters = '0123456789ABCDEF';
  var color = '#';
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

